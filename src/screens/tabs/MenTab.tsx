import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ProductCard from '../../components/ProductCard';

const SUB_CATEGORIES = [
  { id: '1', name: 'Casual', img: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=200&q=80' },
  { id: '2', name: 'Ethnic', img: 'https://images.unsplash.com/photo-1596455607563-ad6193f76b17?auto=format&fit=crop&w=200&q=80' },
  { id: '3', name: 'Footwear', img: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=200&q=80' },
  { id: '4', name: 'Sports', img: 'https://images.unsplash.com/photo-1556815302-0985223c6c0e?auto=format&fit=crop&w=200&q=80' },
  { id: '5', name: 'Essentials', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=200&q=80' },
];

export default function MenTab({ products }: { products: any[] }) {
  const [timeLeft, setTimeLeft] = useState(23 * 3600 + 18 * 60 + 58);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')} hrs ${m.toString().padStart(2, '0')} min ${s.toString().padStart(2, '0')} sec`;
  };

  return (
    <View className="bg-white">
      {/* Sub Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16 }}>
        {SUB_CATEGORIES.map(cat => (
          <TouchableOpacity key={cat.id} className="items-center w-[60px]">
            <View className="w-[60px] h-[60px] rounded-lg overflow-hidden mb-2 bg-gray-100">
              <Image source={{ uri: cat.img }} className="w-full h-full" />
            </View>
            <Text className="text-[10px] text-[#1A1A1A] font-medium text-center" numberOfLines={1}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Countdown Banner */}
      <View className="px-4 mb-6">
        <LinearGradient
          colors={['#FF6B35', '#008B45']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-xl p-4 items-center shadow-sm"
        >
          <Text className="text-white text-[11px] font-bold tracking-widest mb-1">WEEKEND OFFER ENDS IN:</Text>
          <View className="bg-black/30 px-4 py-1.5 rounded-full mb-3">
            <Text className="text-white text-[16px] font-extrabold tracking-widest">{formatTime(timeLeft)}</Text>
          </View>
          <Text className="text-white text-[15px] font-extrabold text-center mb-1">FLAT ₹100 OFF</Text>
          <Text className="text-white/90 text-[10px] mb-4">USE CODE: JHATPAT100</Text>
          <TouchableOpacity className="bg-white px-6 py-2 rounded-full shadow-sm">
            <Text className="text-[#008B45] text-[12px] font-extrabold">Shop Now →</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Brand Partners */}
      <View className="mb-6 bg-gray-50 py-4">
        <Text className="text-[12px] font-extrabold text-[#757575] uppercase tracking-wider px-4 mb-3">Powered By Local Brands</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
          {['Sharma Men\'s Wear', 'Royal Boutiques', 'Metro Shoes', 'Z-Fashion', 'Trendy Local'].map((brand, i) => (
            <View key={i} className="bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm">
              <Text className="text-[#1A1A1A] font-bold text-xs">{brand}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Product Grid */}
      <View className="px-4 pb-20">
        <Text className="text-[15px] font-extrabold text-[#1A1A1A] mb-3">Trending in Men's Wear</Text>
        <View className="flex-row flex-wrap justify-between">
          {products.slice(0, 6).map(p => (
            <ProductCard key={p.id} product={{...p, distance: '0.5 km'}} />
          ))}
        </View>
      </View>
    </View>
  );
}
