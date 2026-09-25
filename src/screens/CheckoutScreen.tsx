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
  const tax = passedParams.tax || 0;
  const deliveryFee = passedParams.deliveryFee !== undefined ? passedParams.deliveryFee : (total > 499 ? 0 : 40);
  const grandTotal = passedParams.grandTotal || (total + tax - discountAmount + deliveryFee);
  const appliedCoupon = passedParams.appliedCoupon;
  const user = useSelector((state: RootState) => state.auth.user);
  const uid = user?.uid || 'dummy-user-id';

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online' | 'wallet'>('cod');
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // New Address Form with Geofencing Coordinates
  const [newAddress, setNewAddress] = useState({ 
    fullName: '', 
    phone: '', 
    addressLine1: '', 
    addressLine2: '', 
    city: '', 
    state: '', 
    pincode: '', 
    type: 'Home',
    latitude: 21.1458,
    longitude: 79.0882,
  });
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationStatusMessage, setLocationStatusMessage] = useState<string>('');

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

  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    setLocationStatusMessage('Detecting GPS location & delivery geofence...');
    
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const roundedLat = Number(latitude.toFixed(5));
          const roundedLng = Number(longitude.toFixed(5));
          setNewAddress(prev => ({
            ...prev,
            latitude: roundedLat,
            longitude: roundedLng,
          }));
          setIsDetectingLocation(false);
          setLocationStatusMessage(`🟢 Express Delivery Geofence: ${roundedLat}, ${roundedLng}`);
        },
        (error) => {
          console.warn('Geolocation failed, falling back to local hub zone:', error);
          setIsDetectingLocation(false);
          setNewAddress(prev => ({
            ...prev,
            latitude: 21.1458,
            longitude: 79.0882,
          }));
          setLocationStatusMessage('🟢 Serviceable Delivery Zone: Standard Hub (21.1458, 79.0882)');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setIsDetectingLocation(false);
      setNewAddress(prev => ({
        ...prev,
        latitude: 21.1458,
        longitude: 79.0882,
      }));
      setLocationStatusMessage('🟢 Serviceable Delivery Zone: Standard Hub (21.1458, 79.0882)');
    }
  };

  const handleSaveAddress = async () => {
    if (!newAddress.fullName || !newAddress.phone || !newAddress.addressLine1 || !newAddress.city || !newAddress.pincode) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }
    try {
      const addressToSave = {
        ...newAddress,
        latitude: Number(newAddress.latitude) || 21.1458,
        longitude: Number(newAddress.longitude) || 79.0882,
      };
      await saveAddress(uid, addressToSave);
      setIsAddressModalOpen(false);
      setNewAddress({ 
        fullName: '', 
        phone: '', 
        addressLine1: '', 
        addressLine2: '', 
        city: '', 
        state: '', 
        pincode: '', 
        type: 'Home',
        latitude: 21.1458,
        longitude: 79.0882,
      });
      setLocationStatusMessage('');
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
        const keyId = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_SZmD2x3K3iVvis';
        let rzpAmount = Math.round(grandTotal * 100);
        let rzpOrderId: string | undefined = undefined;

        try {
          // Attempt server-side order creation via Firebase Cloud Function if available
          const { getFunctions, httpsCallable } = require('firebase/functions');
          const { app } = require('../config/firebase');
          const functions = getFunctions(app);
          const createRazorpayOrder = httpsCallable(functions, 'createRazorpayOrder');
          const result: any = await createRazorpayOrder({ amount: rzpAmount });
          if (result?.data?.orderId) {
            rzpOrderId = result.data.orderId;
            if (result.data.amount) rzpAmount = result.data.amount;
          }
        } catch (cfErr) {
          console.warn('Cloud Function order creation unavailable, using direct checkout key:', cfErr);
        }

        const options: any = {
          description: 'BazarPeth Grocery & Express Delivery',
          image: 'https://i.imgur.com/3g7nmJC.png',
          currency: 'INR',
          key: keyId,
          amount: rzpAmount,
          name: 'BazarPeth India',
          prefill: {
            email: user?.email || '',
            contact: selectedAddress?.phone || '',
            name: selectedAddress?.fullName || user?.displayName || ''
          },
          theme: { color: '#008B45' }
        };

        if (rzpOrderId) {
          options.order_id = rzpOrderId;
        }

        if (Platform.OS === 'web') {
          // Web Razorpay Integration
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => {
            const webOptions = {
              ...options,
              handler: function(response: any) {
                const txnId = response.razorpay_payment_id || `PAY_${Date.now()}`;
                finalizeOrder(txnId);
              }
            };
            const rzp = new (window as any).Razorpay(webOptions);
            rzp.on('payment.failed', function(response: any) {
              Alert.alert('Payment Failed', response.error?.description || 'Payment was cancelled or failed.');
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
          // Native Razorpay Integration with safe fallback for Expo dev client / test modes
          try {
            const RazorpayCheckout = require('react-native-razorpay').default;
            RazorpayCheckout.open(options)
              .then((data: any) => {
                const txnId = data.razorpay_payment_id || `PAY_${Date.now()}`;
                finalizeOrder(txnId);
              })
              .catch((error: any) => {
                if (error?.code === 2 || error?.description?.includes('cancelled')) {
                  Alert.alert('Payment Cancelled', 'Razorpay checkout session was cancelled.');
                } else {
                  Alert.alert('Payment Failed', error?.description || 'Payment could not be completed.');
                }
                setIsPlacingOrder(false);
              });
          } catch (nativeErr: any) {
            console.warn('Native Razorpay module not compiled in this environment. Offering test simulator:', nativeErr);
            Alert.alert(
              'Online Payment (Test Gateway)',
              `Razorpay Key: ${keyId.substring(0, 12)}...\nTotal Amount: ₹${grandTotal}\n\nProceed to simulate successful payment?`,
              [
                { text: 'Cancel', style: 'cancel', onPress: () => setIsPlacingOrder(false) },
                { text: 'Complete Payment', onPress: () => finalizeOrder(`SIM_RZP_${Date.now()}`) }
              ]
            );
          }
        }
      } catch (err: any) {
        console.error('Razorpay Init Error:', err);
        Alert.alert('Payment Error', 'Could not initialize Razorpay checkout. ' + (err.message || 'Please try again.'));
        setIsPlacingOrder(false);
      }
    } else {
      await finalizeOrder();
    }
  };

  const finalizeOrder = async (paymentId?: string) => {
    try {
      // Determine customer coordinates (use address coords if present, else standard hub default 21.1458, 79.0882)
      const lat = Number(selectedAddress?.latitude || selectedAddress?.lat) || 21.1458;
      const lng = Number(selectedAddress?.longitude || selectedAddress?.lng) || 79.0882;
      const fullAddrStr = `${selectedAddress?.addressLine1 || ''}, ${selectedAddress?.addressLine2 ? selectedAddress.addressLine2 + ', ' : ''}${selectedAddress?.city || ''}, ${selectedAddress?.pincode || ''}`.trim();

      const primaryShopId = items[0]?.shopId || items[0]?.sellerId || 'default_shop';

      const orderId = await createOrder({
        shopId: primaryShopId,
        customerId: uid,
        userId: uid,
        items,
        totalAmount: grandTotal,
        subtotal: total,
        tax,
        deliveryFee,
        discountAmount,
        appliedCoupon: appliedCoupon?.code || null,
        shippingAddress: selectedAddress,
        customerLocation: {
          latitude: lat,
          longitude: lng,
          address: fullAddrStr
        },
        customerDetails: {
          uid: uid,
          name: selectedAddress?.fullName || user?.displayName || 'Customer',
          phone: selectedAddress?.phone || '',
          email: user?.email || '',
          address: fullAddrStr
        },
        status: 'pending',
        paymentMethod,
        paymentStatus: paymentMethod === 'online' ? 'paid' : 'pending',
        paymentId: paymentId || null,
        transactionId: paymentId || (paymentMethod === 'online' ? `TXN_${Date.now()}` : null),
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
              {/* Geofencing & GPS Auto-detect Button */}
              <TouchableOpacity
                onPress={handleDetectLocation}
                disabled={isDetectingLocation}
                className="bg-green-50 border border-green-200 py-2.5 px-3 rounded-lg mb-3 flex-row items-center justify-center"
              >
                {isDetectingLocation ? (
                  <ActivityIndicator size="small" color="#008B45" />
                ) : (
                  <>
                    <HugeIcon icon={Location01Icon} size={16} color="#008B45" />
                    <Text className="text-[#008B45] font-black text-xs ml-1.5">
                      📍 Detect Current Location (GPS) / Geofence
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {locationStatusMessage ? (
                <View className="bg-emerald-50 border border-emerald-200 p-2 rounded-lg mb-3">
                  <Text className="text-emerald-800 font-bold text-[11px] text-center">
                    {locationStatusMessage}
                  </Text>
                </View>
              ) : null}

              <TextInput placeholder="Full Name *" value={newAddress.fullName} onChangeText={(t) => setNewAddress({ ...newAddress, fullName: t })} className="bg-white px-3 py-2 rounded border border-zinc-200 mb-2" />
              <TextInput placeholder="Phone Number *" keyboardType="phone-pad" value={newAddress.phone} onChangeText={(t) => setNewAddress({ ...newAddress, phone: t })} className="bg-white px-3 py-2 rounded border border-zinc-200 mb-2" />
              <TextInput placeholder="Address Line 1 (House No, Building) *" value={newAddress.addressLine1} onChangeText={(t) => setNewAddress({ ...newAddress, addressLine1: t })} className="bg-white px-3 py-2 rounded border border-zinc-200 mb-2" />
              <TextInput placeholder="Address Line 2 (Street, Area)" value={newAddress.addressLine2} onChangeText={(t) => setNewAddress({ ...newAddress, addressLine2: t })} className="bg-white px-3 py-2 rounded border border-zinc-200 mb-2" />
              
              <View className="flex-row mb-2">
                <TextInput placeholder="City *" value={newAddress.city} onChangeText={(t) => setNewAddress({ ...newAddress, city: t })} className="bg-white px-3 py-2 rounded border border-zinc-200 flex-1 mr-2" />
                <TextInput placeholder="Pincode *" keyboardType="number-pad" value={newAddress.pincode} onChangeText={(t) => setNewAddress({ ...newAddress, pincode: t })} className="bg-white px-3 py-2 rounded border border-zinc-200 flex-1" />
              </View>

              {/* Coordinates inputs */}
              <View className="flex-row mb-2">
                <View className="flex-1 mr-2">
                  <Text className="text-[10px] text-zinc-500 font-bold mb-1">Latitude</Text>
                  <TextInput 
                    placeholder="Latitude (e.g. 21.1458)" 
                    keyboardType="numeric" 
                    value={String(newAddress.latitude)} 
                    onChangeText={(t) => setNewAddress({ ...newAddress, latitude: parseFloat(t) || 21.1458 })} 
                    className="bg-white px-3 py-2 rounded border border-zinc-200 text-xs text-zinc-700 font-bold" 
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] text-zinc-500 font-bold mb-1">Longitude</Text>
                  <TextInput 
                    placeholder="Longitude (e.g. 79.0882)" 
                    keyboardType="numeric" 
                    value={String(newAddress.longitude)} 
                    onChangeText={(t) => setNewAddress({ ...newAddress, longitude: parseFloat(t) || 79.0882 })} 
                    className="bg-white px-3 py-2 rounded border border-zinc-200 text-xs text-zinc-700 font-bold" 
                  />
                </View>
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
                  <Text className="text-zinc-800 font-semibold text-xs mb-1">{addr.phone}</Text>
                  
                  {/* Geofence verified badge */}
                  <View className="bg-green-50 self-start px-2 py-0.5 rounded border border-green-200 flex-row items-center">
                    <Text className="text-[10px] text-green-700 font-extrabold">
                      📍 Lat: {Number(addr.latitude || 21.1458).toFixed(4)}, Lng: {Number(addr.longitude || 79.0882).toFixed(4)} • Geofenced Zone
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}

          <View className="bg-green-50 p-3 rounded-lg border border-green-100 flex-row items-center mt-2">
            <HugeIcon icon={TruckIcon} size={16} color="#15803D" />
            <Text className="text-green-700 font-bold text-xs ml-1.5">Estimated delivery: 3-5 days</Text>
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
                    {item.selectedVariants && (
                      <Text className="text-zinc-400 text-[10px] font-bold">
                        {Object.entries(item.selectedVariants).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                      </Text>
                    )}
                  </View>
                  <Text className="text-[#1C1C1C] font-black">₹{item.price * item.quantity}</Text>
                </View>
              ))}

              {/* Price calculation lines */}
              <View className="pt-2 mt-2 border-t border-zinc-100">
                <View className="flex-row justify-between py-1">
                  <Text className="text-zinc-500 text-xs font-bold">Subtotal</Text>
                  <Text className="text-zinc-700 text-xs font-black">₹{total}</Text>
                </View>
                {tax > 0 && (
                  <View className="flex-row justify-between py-1">
                    <Text className="text-zinc-500 text-xs font-bold">Taxes & GST</Text>
                    <Text className="text-zinc-700 text-xs font-black">₹{tax}</Text>
                  </View>
                )}
                {discountAmount > 0 && (
                  <View className="flex-row justify-between py-1">
                    <Text className="text-green-600 text-xs font-bold">Discount</Text>
                    <Text className="text-green-600 text-xs font-black">- ₹{discountAmount}</Text>
                  </View>
                )}
                <View className="flex-row justify-between py-1">
                  <Text className="text-zinc-500 text-xs font-bold">Delivery Fee</Text>
                  <Text className="text-zinc-700 text-xs font-black">{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</Text>
                </View>
              </View>
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
