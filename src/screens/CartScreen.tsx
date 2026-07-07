import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, TextInput, Alert, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HugeIcon } from '../components/HugeIcon';
import { ShoppingCart01Icon, MinusSignIcon, Add01Icon, Delete02Icon, TagIcon, ArrowRightIcon, Tick01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { addToCart, removeFromCart, deleteFromCart, clearCart } from '../store/slices/cartSlice';
import { useNavigation } from '@react-navigation/native';
import SafeImage from '../components/SafeImage';
import { validateCoupon } from '../services/firestoreService';

export default function CartScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  
  const { items, total, count } = useSelector((state: RootState) => state.cart);
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Derived Pricing
  const deliveryFee = total > 499 ? 0 : 40;
  const grandTotal = total - discountAmount + deliveryFee;

  useEffect(() => {
    // Re-validate coupon if cart total changes
    if (appliedCoupon) {
      if (total < (appliedCoupon.minOrderValue || appliedCoupon.minPurchase || 0)) {
        removeCoupon();
        Alert.alert('Coupon Removed', 'Cart total no longer meets the minimum requirement for this coupon.');
      } else {
        const discount = appliedCoupon.type === 'flat' 
          ? appliedCoupon.value 
          : Math.min((total * appliedCoupon.value) / 100, appliedCoupon.maxDiscount || Infinity);
        setDiscountAmount(Math.round(discount));
      }
    }
  }, [total]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError('');
    try {
      const result = await validateCoupon(couponCode, total);
      if (result.valid) {
        setAppliedCoupon(result.coupon);
        setDiscountAmount((result as any).discount || 0);
        setCouponCode('');
      } else {
        setCouponError((result as any).message || 'Error applying coupon');
      }
    } catch (e) {
      setCouponError('Error applying coupon');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const handleQuantityDecrease = (item: any) => {
    if (item.quantity === 1) {
      if (Platform.OS === 'web') {
        if (window.confirm("Are you sure you want to remove this item from your cart?")) {
          dispatch(removeFromCart(item.id));
        }
      } else {
        Alert.alert(
          "Remove Item",
          "Are you sure you want to remove this item from your cart?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Remove", style: "destructive", onPress: () => dispatch(removeFromCart(item.id)) }
          ]
        );
      }
    } else {
      dispatch(removeFromCart(item.id));
    }
  };

  const renderCartItem = ({ item }: { item: any }) => (
    <View className="bg-white mb-3 rounded-xl border border-zinc-100 shadow-sm mx-4">
      <View className="p-4 flex-row">
        {/* Image */}
        <View className="w-20 h-20 bg-zinc-50 rounded-lg overflow-hidden border border-zinc-100 mr-4">
          {item.imageUrl ? (
            <SafeImage uri={item.imageUrl} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="flex-1 items-center justify-center"><HugeIcon icon={ShoppingCart01Icon} size={24} color="#9CA3AF" /></View>
          )}
        </View>

        {/* Info */}
        <View className="flex-1 justify-between py-1">
          <View>
            <View className="flex-row justify-between items-start">
              <Text className="text-[14px] font-bold text-[#1C1C1C] leading-tight mb-1 flex-1 pr-2" numberOfLines={2}>
                {item.name}
              </Text>
              <TouchableOpacity 
                style={{ padding: 8, margin: -8, zIndex: 20, elevation: 5 }}
                onPress={() => {
                  if (Platform.OS === 'web') {
                    if (window.confirm("Are you sure you want to remove this item?")) {
                      dispatch(deleteFromCart(item.id));
                    }
                  } else {
                    Alert.alert("Remove Item", "Are you sure you want to remove this item?", [
                      { text: "Cancel", style: "cancel" },
                      { text: "Remove", style: "destructive", onPress: () => {
                        dispatch(deleteFromCart(item.id));
                      }}
                    ]);
                  }
                }}
              >
                <HugeIcon icon={Delete02Icon} size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
            {/* Variants (dynamic from item.selectedVariants) */}
            {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
              <View className="flex-row flex-wrap items-center mb-2 gap-1">
                {Object.entries(item.selectedVariants).map(([key, val]) => (
                  <Text key={key} className="text-[10px] text-zinc-500 font-extrabold uppercase bg-zinc-100 px-2 py-0.5 rounded">
                    {key}: {val}
                  </Text>
                ))}
              </View>
            )}
          </View>

          <View className="flex-row items-center justify-between mt-1">
            <View className="flex-row items-center">
              <Text className="text-base font-black text-[#008B45]">₹{item.price}</Text>
              {item.originalPrice && item.originalPrice > item.price && (
                <Text className="text-[10px] text-zinc-400 font-bold line-through ml-2">₹{item.originalPrice}</Text>
              )}
            </View>

            <View className="flex-row items-center bg-[#FFF8F8] border border-red-100 rounded-lg">
              <TouchableOpacity onPress={() => handleQuantityDecrease(item)} className="p-1.5 px-2">
                <HugeIcon icon={MinusSignIcon} size={14} color="#008B45" />
              </TouchableOpacity>
              <Text className="text-[#1C1C1C] font-black text-sm px-2 w-6 text-center">{item.quantity}</Text>
              <TouchableOpacity onPress={() => dispatch(addToCart({ ...item, quantity: 1 }))} className="p-1.5 px-2">
                <HugeIcon icon={Add01Icon} size={14} color="#008B45" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderFooter = () => (
    <View className="px-4 mt-2 pb-32">
      {/* Coupon Section */}
      <View className="bg-white p-4 rounded-xl shadow-sm border border-zinc-100 mb-4">
        <View className="flex-row items-center mb-3">
          <HugeIcon icon={TagIcon} size={16} color="#1C1C1C" />
          <Text className="font-extrabold text-[#1C1C1C] ml-2 text-sm">Have a coupon?</Text>
        </View>

        {appliedCoupon ? (
          <View className="bg-green-50 border border-green-200 rounded-xl p-3 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <HugeIcon icon={Tick01Icon} size={18} color="#16A34A" />
              <View className="ml-2">
                <Text className="font-black text-green-700">{appliedCoupon.code}</Text>
                <Text className="text-[10px] text-green-600 font-bold mt-0.5">₹{discountAmount} savings applied!</Text>
              </View>
            </View>
            <TouchableOpacity onPress={removeCoupon} className="p-1">
              <HugeIcon icon={Cancel01Icon} size={16} color="#16A34A" />
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View className="flex-row items-center">
              <TextInput
                value={couponCode}
                onChangeText={setCouponCode}
                placeholder="Enter coupon code"
                placeholderTextColor="#9CA3AF"
                className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 font-bold text-[#1C1C1C]"
                autoCapitalize="characters"
              />
              <TouchableOpacity 
                onPress={handleApplyCoupon}
                disabled={isApplyingCoupon || !couponCode.trim()}
                className={`ml-2 px-4 py-3 rounded-lg ${couponCode.trim() ? 'bg-[#1C1C1C]' : 'bg-zinc-200'}`}
              >
                <Text className={`font-black ${couponCode.trim() ? 'text-white' : 'text-zinc-400'}`}>
                  {isApplyingCoupon ? '...' : 'APPLY'}
                </Text>
              </TouchableOpacity>
            </View>
            {couponError ? <Text className="text-red-500 text-xs font-bold mt-2 ml-1">{couponError}</Text> : null}
          </View>
        )}
      </View>

      {/* Price Breakdown */}
      <View className="bg-white p-5 rounded-xl shadow-sm border border-zinc-100">
        <Text className="font-black text-[#1C1C1C] text-base mb-4">Price Breakdown</Text>
        
        <View className="flex-row justify-between mb-3">
          <Text className="text-zinc-500 font-bold text-sm">Subtotal ({count} items)</Text>
          <Text className="text-[#1C1C1C] font-black text-sm">₹{total}</Text>
        </View>

        {discountAmount > 0 && (
          <View className="flex-row justify-between mb-3">
            <Text className="text-green-600 font-bold text-sm">Discount</Text>
            <Text className="text-green-600 font-black text-sm">- ₹{discountAmount}</Text>
          </View>
        )}

        <View className="flex-row justify-between mb-4 items-center">
          <Text className="text-zinc-500 font-bold text-sm">Delivery Charges</Text>
          {deliveryFee === 0 ? (
            <View className="flex-row items-center">
              <Text className="text-zinc-400 font-bold line-through text-xs mr-2">₹40</Text>
              <Text className="text-green-600 font-black text-sm">FREE</Text>
            </View>
          ) : (
            <Text className="text-[#1C1C1C] font-black text-sm">₹{deliveryFee}</Text>
          )}
        </View>

        <View className="h-[1px] bg-zinc-200 border-dashed mb-4" />

        <View className="flex-row justify-between items-center mb-1">
          <Text className="font-black text-[#1C1C1C] text-lg">Total Amount</Text>
          <Text className="font-black text-[#008B45] text-xl">₹{grandTotal}</Text>
        </View>
        
        {(discountAmount > 0 || deliveryFee === 0) && (
          <Text className="text-green-600 font-extrabold text-[11px] text-right mt-1">
            You save ₹{discountAmount + (deliveryFee === 0 ? 40 : 0)} on this order
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]" edges={['top']}>
      {/* Header */}
      <View className="px-5 py-4 flex-row items-center border-b border-zinc-100 bg-white">
        <Text className="text-2xl font-black text-[#1C1C1C]">My Cart</Text>
        {count > 0 && (
          <View className="bg-zinc-100 px-2 py-0.5 rounded ml-2 mt-1">
            <Text className="text-zinc-500 font-bold text-xs">{count} items</Text>
          </View>
        )}
      </View>

      {count === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-32 h-32 bg-red-50 rounded-full items-center justify-center mb-6 border border-red-100">
            <HugeIcon icon={ShoppingCart01Icon} size={48} color="#008B45" />
          </View>
          <Text className="text-2xl font-black text-[#1C1C1C] mb-2">Your cart is empty</Text>
          <Text className="text-zinc-500 font-medium text-center text-sm mb-8 px-4">
            Looks like you haven't added any products to your cart yet.
          </Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Home')}
            className="bg-[#1C1C1C] px-8 py-4 rounded-full flex-row items-center shadow-md"
          >
            <Text className="text-white font-black mr-2">Start Shopping</Text>
            <HugeIcon icon={ArrowRightIcon} size={18} color="white" />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderCartItem}
            ListHeaderComponent={<View className="h-4" />}
            ListFooterComponent={renderFooter}
            showsVerticalScrollIndicator={false}
          />

          {/* Sticky Bottom Bar */}
          <View className="absolute bottom-0 w-full bg-white px-5 py-4 border-t border-zinc-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
            <TouchableOpacity 
              onPress={() => navigation.navigate('Checkout', { grandTotal, discountAmount, deliveryFee, appliedCoupon })}
              className="bg-[#008B45] rounded-xl flex-row items-center justify-between px-5 h-14 shadow-md"
            >
              <View>
                <Text className="text-white/80 font-bold text-[10px] uppercase">Amount to pay</Text>
                <Text className="text-white font-black text-lg leading-tight">₹{grandTotal}</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-white font-black tracking-wide mr-2">Proceed to Checkout</Text>
                <HugeIcon icon={ArrowRightIcon} size={18} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
