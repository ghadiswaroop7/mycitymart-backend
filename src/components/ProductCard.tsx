import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import SafeImage from './SafeImage';

export type ProductProps = {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  rating: number;
  vendor: string;
  imageUrl?: string;
  deliveryTime?: string;
  distance?: string;
};

export default function ProductCard({ product }: { product: ProductProps }) {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();

  const discount = product.originalPrice > 0
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
      className="bg-white rounded-2xl border border-zinc-100 shadow-sm w-[47%] mb-6 overflow-hidden"
    >
      {/* Image Section — 3:4 aspect */}
      <View className="w-full aspect-[3/4] bg-zinc-50 relative">
        <SafeImage 
          uri={(product as any).images?.[0] || (product as any).image || product.imageUrl} 
          className="w-full h-full" 
          resizeMode="cover" 
        />

        {/* Discount Badge */}
        {discount > 0 ? (
          <View className="absolute top-2 left-2 bg-green-600 px-2 py-0.5 rounded-full">
            <Text className="text-white text-[9px] font-poppins-bold">{discount}% OFF</Text>
          </View>
        ) : null}
      </View>

      <View className="p-3.5">
        {/* Title */}
        <Text className="text-[13px] font-poppins-semibold text-[#1A1A1A] mb-1.5 leading-tight" numberOfLines={2}>
          {product.name}
        </Text>
        
        {/* Shop Name & Distance */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-[11px] font-poppins-light text-[#1A1A1A] opacity-80" numberOfLines={1} style={{ flex: 1 }}>
            By {product.vendor}
          </Text>
          {product.distance ? (
            <Text className="text-[10px] font-poppins-medium text-blue-600 ml-1">
              {product.distance}
            </Text>
          ) : null}
        </View>

        {/* Price & Add Button Row */}
        <View className="flex-row items-center justify-between">
          <View>
            <View className="flex-row items-center">
              <Text className="text-[15px] font-poppins-bold text-[#1A1A1A]">₹{product.price}</Text>
              {product.originalPrice > product.price && (
                <Text className="text-[11px] font-poppins-light text-zinc-400 line-through ml-1.5">₹{product.originalPrice}</Text>
              )}
            </View>
          </View>
          
          <TouchableOpacity
            onPress={() => dispatch(addToCart({
              id: product.id,
              name: product.name,
              price: product.price,
              originalPrice: product.originalPrice,
              quantity: 1,
              imageUrl: product.imageUrl,
              vendor: product.vendor,
            }))}
            className="border border-[#008B45] rounded-full px-3 py-1 bg-[#008B45]/5"
          >
            <Text className="text-[#008B45] text-[10px] font-poppins-bold">ADD</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
