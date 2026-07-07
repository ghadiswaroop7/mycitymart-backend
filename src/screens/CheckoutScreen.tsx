import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HugeIcon } from '../components/HugeIcon';
import {  ArrowLeft01Icon, Location01Icon, CreditCardIcon, BanknoteIcon, WalletIcon, ChevronDownIcon, ChevronUpIcon, Add01Icon, Tick01Icon , TruckIcon } from '@hugeicons/core-free-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { clearCart } from '../store/slices/cartSlice';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getUserAddresses, createOrder, saveAddress } from '../services/firestoreService';

export default function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();

  const { items, total } = useSelector((state: RootState) => state.cart);

  // Use passed params OR calculate dynamically from cart state if missing (e.g., from direct 'Buy Now')
  const passedParams = route.params || {};
  const discountAmount = passedParams.discountAmount || 0;
  const deliveryFee = passedParams.deliveryFee !== undefined ? passedParams.deliveryFee : (total > 499 ? 0 : 40);
  const grandTotal = passedParams.grandTotal || (total - discountAmount + deliveryFee);
  const appliedCoupon = passedParams.appliedCoupon;
  const user = useSelector((state: RootState) => state.auth.user);
  const uid = user?.uid || 'dummy-user-id';

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online' | 'wallet'>('cod');
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // New Address Form
  const [newAddress, setNewAddress] = useState({ fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', type: 'Home' });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const data = await getUserAddresses(uid);
      setAddresses(data);
      if (data.length > 0 && !selectedAddress) setSelectedAddress(data[0]);
    } catch (e) {
    }
  };

  const handleSaveAddress = async () => {
    if (!newAddress.fullName || !newAddress.phone || !newAddress.addressLine1 || !newAddress.city || !newAddress.pincode) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }
    try {
      await saveAddress(uid, newAddress);
      setIsAddressModalOpen(false);
      setNewAddress({ fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', type: 'Home' });
      fetchAddresses();
    } catch (e) {
      Alert.alert('Error', 'Failed to save address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Address Required', 'Please select or add a delivery address.');
      return;
    }
    if (paymentMethod === 'cod' && grandTotal > 5000) {
      Alert.alert('COD Unavailable', 'Cash on Delivery is only available for orders under ₹5000.');
      return;
    }

    setIsPlacingOrder(true);

    if (paymentMethod === 'online') {
      try {
        // Securely create Razorpay order via Firebase Cloud Function.
        // The secret key is stored SERVER-SIDE only (in Firebase Functions config).
        const { getFunctions, httpsCallable } = require('firebase/functions');
        const { app } = require('../config/firebase');
        const functions = getFunctions(app);
        const createRazorpayOrder = httpsCallable(functions, 'createRazorpayOrder');
        const result: any = await createRazorpayOrder({ amount: Math.round(grandTotal * 100) });
        const { orderId, amount: rzpAmount } = result.data;

        const keyId = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_SZmD2x3K3iVvis';

        const options = {
          description: 'Jhat-Pat Order',
          image: 'https://i.imgur.com/3g7nmJC.png',
          currency: 'INR',
          key: keyId,
          amount: rzpAmount,
          name: 'Jhat-Pat',
          order_id: orderId,
          prefill: {
            email: user?.email || '',
            contact: selectedAddress.phone || '',
            name: selectedAddress.fullName || ''
          },
          theme: { color: '#008B45' }
        };

        if (Platform.OS === 'web') {
          // Web Razorpay Integration
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => {
            const webOptions = {
              ...options,
              handler: function(response: any) {
                finalizeOrder(response.razorpay_payment_id);
              }
            };
            const rzp = new (window as any).Razorpay(webOptions);
            rzp.on('payment.failed', function(response: any) {
              Alert.alert('Payment Failed', response.error.description || 'Payment was cancelled or failed.');
              setIsPlacingOrder(false);
            });
            rzp.open();
          };
          script.onerror = () => {
            Alert.alert('Error', 'Failed to load Razorpay SDK');
            setIsPlacingOrder(false);
          };
          document.body.appendChild(script);
        } else {
          // Native Razorpay Integration
          const RazorpayCheckout = require('react-native-razorpay').default;
          RazorpayCheckout.open(options)
            .then((data: any) => {
              finalizeOrder(data.razorpay_payment_id);
            })
            .catch((error: any) => {
              Alert.alert('Payment Failed', error.description || 'Payment was cancelled or failed.');
              setIsPlacingOrder(false);
            });
        }
      } catch (err: any) {
        console.error('Razorpay Init Error:', err);
        Alert.alert('Payment Error', 'Could not initialize payment. ' + (err.message || 'Please try again.'));
        setIsPlacingOrder(false);
      }
    } else {
      await finalizeOrder();
    }
  };

  const finalizeOrder = async (paymentId?: string) => {
    try {
      const orderId = await createOrder({
        userId: uid,
        items,
        totalAmount: grandTotal,
        subtotal: total,
        deliveryFee,
        discountAmount,
        appliedCoupon: appliedCoupon?.code || null,
        shippingAddress: selectedAddress,
        status: 'placed',
        paymentMethod,
        paymentId: paymentId || null,
      });

      dispatch(clearCart());
      navigation.replace('OrderSuccess', { orderId });
    } catch (e) {
      Alert.alert('Error', 'Failed to place order. Please try again.');
      setIsPlacingOrder(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]" edges={['top']}>
      {/* Header */}
      <View className="px-5 py-4 flex-row items-center bg-white border-b border-zinc-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <HugeIcon icon={ArrowLeft01Icon} size={28} color="#1C1C1C" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-[#1C1C1C]">Checkout</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>

        {/* Section 1: Address */}
        <View className="bg-white p-4 rounded-xl shadow-sm border border-zinc-100 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <HugeIcon icon={Location01Icon} size={20} color="#008B45" />
              <Text className="font-black text-[#1C1C1C] text-base ml-2">Delivery Address</Text>
            </View>
            <TouchableOpacity onPress={() => setIsAddressModalOpen(!isAddressModalOpen)}>
              <Text className="text-[#008B45] font-bold text-sm">+ Add New</Text>
            </TouchableOpacity>
          </View>

          {isAddressModalOpen && (
            <View className="bg-zinc-50 p-4 rounded-lg mb-4 border border-zinc-200">
              <TextInput placeholder="Full Name *" value={newAddress.fullName} onChangeText={(t) => setNewAddress({ ...newAddress, fullName: t })} className="bg-white px-3 py-2 rounded border border-zinc-200 mb-2" />
              <TextInput placeholder="Phone Number *" keyboardType="phone-pad" value={newAddress.phone} onChangeText={(t) => setNewAddress({ ...newAddress, phone: t })} className="bg-white px-3 py-2 rounded border border-zinc-200 mb-2" />
              <TextInput placeholder="Address Line 1 (House No, Building) *" value={newAddress.addressLine1} onChangeText={(t) => setNewAddress({ ...newAddress, addressLine1: t })} className="bg-white px-3 py-2 rounded border border-zinc-200 mb-2" />
              <TextInput placeholder="Address Line 2 (Street, Area)" value={newAddress.addressLine2} onChangeText={(t) => setNewAddress({ ...newAddress, addressLine2: t })} className="bg-white px-3 py-2 rounded border border-zinc-200 mb-2" />
              <View className="flex-row mb-2">
                <TextInput placeholder="City *" value={newAddress.city} onChangeText={(t) => setNewAddress({ ...newAddress, city: t })} className="bg-white px-3 py-2 rounded border border-zinc-200 flex-1 mr-2" />
                <TextInput placeholder="Pincode *" keyboardType="number-pad" value={newAddress.pincode} onChangeText={(t) => setNewAddress({ ...newAddress, pincode: t })} className="bg-white px-3 py-2 rounded border border-zinc-200 flex-1" />
              </View>
              <TouchableOpacity onPress={handleSaveAddress} className="bg-[#1C1C1C] py-3 rounded-lg items-center mt-2">
                <Text className="text-white font-black">Save Address</Text>
              </TouchableOpacity>
            </View>
          )}

          {addresses.length === 0 && !isAddressModalOpen ? (
            <Text className="text-zinc-500 font-medium text-sm text-center py-4">No addresses found. Please add one.</Text>
          ) : (
            addresses.map((addr) => (
              <TouchableOpacity
                key={addr.id}
                onPress={() => setSelectedAddress(addr)}
                className={`flex-row p-3 rounded-xl border mb-2 ${selectedAddress?.id === addr.id ? 'border-[#008B45] bg-red-50' : 'border-zinc-200 bg-white'}`}
              >
                <View className="mt-1">
                  {selectedAddress?.id === addr.id ? (
                    <HugeIcon icon={Tick01Icon} size={20} color="#008B45" />
                  ) : (
                    <View className="w-5 h-5 rounded-full border-2 border-zinc-300" />
                  )}
                </View>
                <View className="ml-3 flex-1">
                  <View className="flex-row items-center mb-1">
                    <Text className="font-bold text-[#1C1C1C]">{addr.fullName}</Text>
                    <View className="bg-zinc-200 px-2 py-0.5 rounded ml-2">
                      <Text className="text-[10px] font-bold text-zinc-600 uppercase">{addr.type || 'HOME'}</Text>
                    </View>
                  </View>
                  <Text className="text-zinc-600 text-xs mb-1 leading-tight">{addr.addressLine1}, {addr.addressLine2 ? addr.addressLine2 + ', ' : ''}{addr.city}, {addr.pincode}</Text>
                  <Text className="text-zinc-800 font-semibold text-xs">{addr.phone}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}

          <View className="bg-green-50 p-3 rounded-lg border border-green-100 flex-row mt-2">
            <Text className="text-green-700 font-bold text-xs ml-1"><HugeIcon icon={TruckIcon} size={16} /> Estimated delivery: 3-5 days</Text>
          </View>
        </View>

        {/* Section 2: Order Summary Toggle */}
        <View className="bg-white rounded-xl shadow-sm border border-zinc-100 mb-4 overflow-hidden">
          <TouchableOpacity
            onPress={() => setIsSummaryExpanded(!isSummaryExpanded)}
            className="p-4 flex-row justify-between items-center"
          >
            <View>
              <Text className="font-black text-[#1C1C1C] text-base">Order Summary</Text>
              <Text className="text-zinc-500 font-bold text-xs mt-0.5">{items.length} Items • Total: ₹{grandTotal}</Text>
            </View>
            {isSummaryExpanded ? <HugeIcon icon={ChevronUpIcon} size={24} color="#1C1C1C" /> : <HugeIcon icon={ChevronDownIcon} size={24} color="#1C1C1C" />}
          </TouchableOpacity>

          {isSummaryExpanded && (
            <View className="px-4 pb-4 border-t border-zinc-100 pt-3">
              {items.map((item, idx) => (
                <View key={idx} className="flex-row items-center mb-3">
                  <View className="w-12 h-12 bg-zinc-100 rounded mr-3" />
                  <View className="flex-1">
                    <Text className="text-[#1C1C1C] font-bold text-sm" numberOfLines={1}>{item.name}</Text>
                    <Text className="text-zinc-500 text-xs font-semibold">Qty: {item.quantity}</Text>
                  </View>
                  <Text className="text-[#1C1C1C] font-black">₹{item.price * item.quantity}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Section 3: Payment Method */}
        <View className="bg-white p-4 rounded-xl shadow-sm border border-zinc-100 mb-4">
          <Text className="font-black text-[#1C1C1C] text-base mb-4">Payment Method</Text>

          <TouchableOpacity
            onPress={() => setPaymentMethod('online')}
            className={`flex-row items-center p-4 rounded-xl border mb-3 ${paymentMethod === 'online' ? 'border-[#008B45] bg-red-50' : 'border-zinc-200 bg-white'}`}
          >
            <HugeIcon icon={CreditCardIcon} size={24} color={paymentMethod === 'online' ? '#008B45' : '#6B7280'} />
            <View className="ml-3 flex-1">
              <Text className={`font-bold text-base ${paymentMethod === 'online' ? 'text-[#008B45]' : 'text-[#1C1C1C]'}`}>Pay Online</Text>
              <Text className="text-zinc-500 text-xs mt-0.5">UPI, Credit/Debit Card, Netbanking</Text>
            </View>
            {paymentMethod === 'online' && <HugeIcon icon={Tick01Icon} size={24} color="#008B45" />}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPaymentMethod('cod')}
            className={`flex-row items-center p-4 rounded-xl border mb-3 ${paymentMethod === 'cod' ? 'border-[#008B45] bg-red-50' : 'border-zinc-200 bg-white'} ${grandTotal > 5000 ? 'opacity-50' : ''}`}
            disabled={grandTotal > 5000}
          >
            <HugeIcon icon={BanknoteIcon} size={24} color={paymentMethod === 'cod' ? '#008B45' : '#6B7280'} />
            <View className="ml-3 flex-1">
              <Text className={`font-bold text-base ${paymentMethod === 'cod' ? 'text-[#008B45]' : 'text-[#1C1C1C]'}`}>Cash on Delivery</Text>
              {grandTotal > 5000 ? (
                <Text className="text-red-500 text-xs mt-0.5 font-bold">Unavailable for orders &gt; ₹5000</Text>
              ) : (
                <Text className="text-zinc-500 text-xs mt-0.5">Pay in cash or UPI upon delivery</Text>
              )}
            </View>
            {paymentMethod === 'cod' && <HugeIcon icon={Tick01Icon} size={24} color="#008B45" />}
          </TouchableOpacity>
        </View>

        <View className="h-6" />
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View className="bg-white px-5 py-4 border-t border-zinc-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        <View className="flex-row justify-between mb-3">
          <Text className="text-[#1C1C1C] font-black text-lg">Total Amount</Text>
          <Text className="text-[#008B45] font-black text-xl">₹{grandTotal}</Text>
        </View>
        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={isPlacingOrder}
          className={`rounded-xl flex-row items-center justify-center h-14 shadow-md ${!selectedAddress ? 'bg-[#1C1C1C] opacity-80' : 'bg-[#1C1C1C]'}`}
        >
          {isPlacingOrder ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-black text-lg tracking-wide">
              {paymentMethod === 'online' ? 'Pay Now' : 'Place Order'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
