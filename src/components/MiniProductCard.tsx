import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { HugeIcon } from './HugeIcon';
import { Add01Icon, MinusSignIcon } from '@hugeicons/core-free-icons';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart, removeFromCart } from '../store/slices/cartSlice';
import { RootState } from '../store';
import SafeImage from './SafeImage';

interface MiniProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    rating?: number;
    vendor?: string;
    imageUrl?: string;
  };
}

export default function MiniProductCard({ product }: MiniProductCardProps) {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const cartItem = useSelector((state: RootState) => state.cart.items.find(i => i.id === product.id));
  const quantity = cartItem ? cartItem.quantity : 0;

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
      className="bg-white rounded-lg border border-gray-200 mr-3 overflow-hidden"
      style={{ width: 130, height: 190 }}
    >
      {/* ── Image Zone (top 60% = 110px) ── */}
      <View
        className="w-full bg-gray-50 items-center justify-center"
        style={{ height: 110 }}
      >
        <SafeImage
          uri={product.imageUrl}
          className="w-full h-full"
          resizeMode="contain"
        />

        {discount > 0 ? (
          <View className="absolute top-1.5 left-1.5 bg-green-600 rounded px-1 py-0.5">
            <Text className="text-white text-[7px] font-extrabold">{discount}% OFF</Text>
          </View>
        ) : null}
      </View>

      {/* ── Text Zone (bottom 40% = 80px) ── */}
      <View className="px-2 pt-1.5 pb-1.5 flex-1 justify-between">
        <Text
          className="text-[10px] font-semibold text-gray-800 leading-tight"
          numberOfLines={2}
        >
          {product.name}
        </Text>

        <View className="flex-row items-end justify-between mt-1">
          <View>
            <Text className="text-[12px] font-extrabold text-gray-900">₹{product.price}</Text>
            {product.originalPrice && product.originalPrice > product.price ? (
              <Text className="text-[8px] text-gray-400 line-through">₹{product.originalPrice}</Text>
            ) : null}
          </View>

          {quantity === 0 ? (
            <TouchableOpacity
              onPress={() => dispatch(addToCart({
                id: product.id,
                name: product.name,
                price: product.price,
                originalPrice: product.originalPrice || product.price,
                quantity: 1,
                imageUrl: product.imageUrl,
                vendor: product.vendor,
              }))}
              className="border border-[#388E3C] rounded px-2 py-0.5"
            >
              <Text className="text-[#388E3C] text-[9px] font-extrabold">ADD</Text>
            </TouchableOpacity>
          ) : (
            <View className="bg-[#388E3C] flex-row items-center rounded px-1 py-0.5">
              <TouchableOpacity onPress={() => dispatch(removeFromCart(product.id))} className="px-0.5">
                <HugeIcon icon={MinusSignIcon} size={9} color="#FFFFFF" />
              </TouchableOpacity>
              <Text className="text-white text-[9px] font-extrabold mx-1">{quantity}</Text>
              <TouchableOpacity onPress={() => dispatch(addToCart({
                id: product.id,
                name: product.name,
                price: product.price,
                originalPrice: product.originalPrice || product.price,
                quantity: 1,
                imageUrl: product.imageUrl,
                vendor: product.vendor,
              }))} className="px-0.5">
                <HugeIcon icon={Add01Icon} size={9} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
