import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import ProductCard from '../../components/ProductCard';

const SUB_CATEGORIES = [
  { id: '1', name: 'Clothing', img: 'https://images.unsplash.com/photo-1514090259040-c9a721d017bc?auto=format&fit=crop&w=200&q=80' },
  { id: '2', name: 'Toys', img: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?auto=format&fit=crop&w=200&q=80' },
  { id: '3', name: 'Books', img: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=200&q=80' },
  { id: '4', name: 'School Supplies', img: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=200&q=80' },
  { id: '5', name: 'Baby Care', img: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=200&q=80' },
  { id: '6', name: 'Footwear', img: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=200&q=80' },
];

export default function KidsTab({ products }: { products: any[] }) {
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

      {/* Hero Banner */}
      <View className="px-4 mb-6">
        <View className="w-full h-[180px] rounded-xl overflow-hidden bg-blue-100 relative shadow-sm">
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1503919005314-30d93f07d82b?auto=format&fit=crop&w=800&q=80' }} 
            className="w-full h-full" 
          />
          <View className="absolute inset-0 bg-blue-900/30 justify-center items-center p-4">
            <Text className="text-white text-[28px] font-extrabold tracking-wide mb-2 text-center" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 }}>Back to School</Text>
            <Text className="text-[#1A1A1A] text-[14px] font-extrabold text-center bg-yellow-400 px-4 py-1.5 rounded-full shadow-sm">DEALS UP TO 50% OFF</Text>
          </View>
        </View>
      </View>

      {/* Product Grid */}
      <View className="px-4 pb-20">
        <Text className="text-[15px] font-extrabold text-[#1A1A1A] mb-3">Top Kids Collections</Text>
        <View className="flex-row flex-wrap justify-between">
          {products.slice(0, 6).map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </View>
      </View>
    </View>
  );
}
