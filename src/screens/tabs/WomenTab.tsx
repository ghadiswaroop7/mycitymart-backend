import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import ProductCard from '../../components/ProductCard';

const SUB_CATEGORIES = [
  { id: '1', name: 'Ethnic Wear', img: 'https://images.unsplash.com/photo-1583391733958-d25e07fac0ec?auto=format&fit=crop&w=200&q=80' },
  { id: '2', name: 'Western', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=200&q=80' },
  { id: '3', name: 'Footwear', img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=200&q=80' },
  { id: '4', name: 'Beauty', img: 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&w=200&q=80' },
  { id: '5', name: 'Accessories', img: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=200&q=80' },
  { id: '6', name: 'Lingerie', img: 'https://images.unsplash.com/photo-1582236166504-4b57428e5db3?auto=format&fit=crop&w=200&q=80' },
  { id: '7', name: 'Bags', img: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&w=200&q=80' },
];

export default function WomenTab({ products }: { products: any[] }) {
  return (
    <View className="bg-white">
      {/* Sub Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16 }}>
        {SUB_CATEGORIES.map(cat => (
          <TouchableOpacity key={cat.id} className="items-center w-[60px]">
            <View className="w-[60px] h-[60px] rounded-full overflow-hidden mb-2 bg-gray-100">
              <Image source={{ uri: cat.img }} className="w-full h-full" />
            </View>
            <Text className="text-[10px] text-[#1A1A1A] font-medium text-center" numberOfLines={1}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Hero Banner */}
      <View className="px-4 mb-6">
        <View className="w-full h-[180px] rounded-xl overflow-hidden bg-gray-100 relative shadow-sm">
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=800&q=80' }} 
            className="w-full h-full" 
          />
          <View className="absolute inset-0 bg-black/30 justify-center items-center">
            <Text className="text-white text-[24px] font-extrabold tracking-wide mb-1 text-center">Local Boutique Sale</Text>
            <Text className="text-white text-[14px] font-bold text-center bg-[#008B45] px-3 py-1 rounded">Min 20% OFF</Text>
          </View>
        </View>
      </View>

      {/* Top Local Boutiques */}
      <View className="mb-6 bg-pink-50 py-4">
        <Text className="text-[15px] font-extrabold text-[#1A1A1A] px-4 mb-3">Top Local Boutiques</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
          {[
            { name: "Pooja's Collection", rating: 4.5, distance: '2 km', open: true },
            { name: "Rani Boutique", rating: 4.8, distance: '1.2 km', open: true },
            { name: "Shree Creations", rating: 4.2, distance: '3 km', open: false },
          ].map((shop, i) => (
            <View key={i} className="bg-white border border-gray-200 w-[180px] rounded-xl overflow-hidden shadow-sm">
              <View className="h-[100px] bg-gray-200">
                <Image source={{ uri: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=400&q=80' }} className="w-full h-full" />
              </View>
              <View className="p-3">
                <Text className="text-[#1A1A1A] font-bold text-[13px] mb-1" numberOfLines={1}>{shop.name}</Text>
                <Text className="text-[#757575] text-[11px] mb-1">{shop.distance} • ⭐ {shop.rating}</Text>
                <Text className={`text-[10px] font-bold ${shop.open ? 'text-green-600' : 'text-red-600'}`}>{shop.open ? 'Open Now' : 'Closed'}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Product Grid */}
      <View className="px-4 pb-20">
        <Text className="text-[15px] font-extrabold text-[#1A1A1A] mb-3">Trending Near You</Text>
        <View className="flex-row flex-wrap justify-between">
          {products.slice(0, 6).map(p => (
            <ProductCard key={p.id} product={{...p, distance: '2 km'}} />
          ))}
        </View>
      </View>
    </View>
  );
}
