import React, { useState } from 'react';
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
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
    dispatch(addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      quantity: 1,
      imageUrl: product.imageUrl,
      vendor: product.vendor,
    }));
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  const discount = product.originalPrice > 0
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
      className="bg-white rounded-2xl border border-zinc-100 shadow-sm w-full mb-3 overflow-hidden"
    >
      {/* Image Section — Dynamic height for Masonry effect */}
      <View className="w-full bg-zinc-50 relative p-1" style={{ minHeight: 140, height: 140 + (product.name.length % 30) }}>
        <SafeImage 
          uri={product.imageUrl || (product as any).images?.[0] || (product as any).image} 
          style={{ width: '100%', height: '100%' }} 
          resizeMode="cover" 
        />

        {/* Discount Badge */}
        {discount > 0 ? (
          <View className="absolute top-2 left-2 bg-green-600 px-1.5 py-0.5 rounded flex-row items-center">
            <Text className="text-white text-[9px] font-poppins-bold">{discount}% OFF</Text>
          </View>
        ) : null}
      </View>

      <View className="p-2.5 pb-4">
        {/* Title */}
        <Text className="text-[11px] font-poppins-semibold text-[#1A1A1A] mb-1 leading-[16px]" numberOfLines={2}>
          {product.name}
        </Text>
        
        {/* Shop Name & Distance */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-[9px] font-poppins-light text-[#1A1A1A] opacity-80" numberOfLines={1} style={{ flex: 1 }}>
            By {product.vendor}
          </Text>
          {product.distance ? (
            <Text className="text-[9px] font-poppins-medium text-blue-600 ml-1">
              {product.distance}
            </Text>
          ) : null}
        </View>

        {/* Price & Add Button Row */}
        <View className="flex-row items-center justify-between mt-auto">
          <View>
            <View className="flex-row items-center flex-wrap">
              <Text className="text-[13px] font-poppins-bold text-[#1A1A1A]">₹{product.price}</Text>
              {product.originalPrice > product.price && (
                <Text className="text-[9px] font-poppins-light text-zinc-400 line-through ml-1">₹{product.originalPrice}</Text>
              )}
            </View>
          </View>
          
          <TouchableOpacity
            onPress={handleAdd}
            className={`border rounded-md px-2 py-1 ${isAdded ? 'bg-green-600 border-green-600' : 'bg-[#008B45]/5 border-[#008B45]'}`}
          >
            <Text className={`text-[10px] font-poppins-bold ${isAdded ? 'text-white' : 'text-[#008B45]'}`}>
              {isAdded ? 'ADDED ✓' : 'ADD'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
