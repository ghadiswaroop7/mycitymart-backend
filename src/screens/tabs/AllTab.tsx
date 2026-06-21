import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import ProductCard from '../../components/ProductCard';

const { width } = Dimensions.get('window');

const SUB_CATEGORIES = [
  { id: '1', name: 'Fashion', img: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=200&q=80' },
  { id: '2', name: 'Grocery', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80' },
  { id: '3', name: 'Electronics', img: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=200&q=80' },
  { id: '4', name: 'Beauty', img: 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&w=200&q=80' },
  { id: '5', name: 'Home', img: 'https://images.unsplash.com/photo-1583847268964-b28ce8f31586?auto=format&fit=crop&w=200&q=80' },
  { id: '6', name: 'Toys', img: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?auto=format&fit=crop&w=200&q=80' },
];

const BANNERS = [
  { id: 'b1', uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80' },
  { id: 'b2', uri: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80' },
  { id: 'b3', uri: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80' },
];

export default function AllTab({ products }: { products: any[] }) {
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBanner((prev) => {
        const next = prev === BANNERS.length - 1 ? 0 : prev + 1;
        bannerScrollRef.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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

      {/* Hero Banner Auto-sliding */}
      <View style={{ height: 180, marginBottom: 16 }}>
        <ScrollView
          ref={bannerScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setActiveBanner(index);
          }}
        >
          {BANNERS.map(b => (
            <View key={b.id} style={{ width, paddingHorizontal: 16 }}>
              <Image source={{ uri: b.uri }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
            </View>
          ))}
        </ScrollView>
        {/* Dots */}
        <View className="flex-row justify-center mt-3 absolute bottom-2 w-full">
          {BANNERS.map((_, idx) => (
            <View key={idx} className={`h-1.5 mx-1 rounded-full ${activeBanner === idx ? 'w-4 bg-[#008B45]' : 'w-1.5 bg-gray-300'}`} />
          ))}
        </View>
      </View>

      {/* Offers Strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 24 }}>
        <View className="bg-red-50 border border-red-200 px-4 py-2 rounded-full flex-row items-center">
          <Text className="text-[#008B45] font-extrabold text-xs">🏷️ FLAT ₹50 OFF</Text>
        </View>
        <View className="bg-orange-50 border border-orange-200 px-4 py-2 rounded-full flex-row items-center">
          <Text className="text-[#FF6B35] font-extrabold text-xs">🏷️ BUY 2 GET 1</Text>
        </View>
        <View className="bg-green-50 border border-green-200 px-4 py-2 rounded-full flex-row items-center">
          <Text className="text-green-700 font-extrabold text-xs">🏷️ FREE DELIVERY</Text>
        </View>
      </ScrollView>

      {/* Still Looking For These? */}
      {products.length > 0 && (
        <View className="mb-6">
          <Text className="text-[15px] font-extrabold text-[#1A1A1A] px-4 mb-3">Still Looking For These?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
            {products.slice(0, 5).map(p => (
              <TouchableOpacity key={p.id} className="w-[100px] border border-gray-200 rounded-xl p-2">
                <View className="w-full h-[80px] bg-gray-50 rounded-lg mb-2 overflow-hidden">
                  {p.imageUrl ? <Image source={{ uri: p.imageUrl }} className="w-full h-full" resizeMode="cover" /> : null}
                </View>
                <Text className="text-[11px] font-medium text-[#1A1A1A] mb-1 leading-tight" numberOfLines={2}>{p.name}</Text>
                <Text className="text-[12px] font-extrabold text-[#1A1A1A]">₹{p.price}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Suggested For You */}
      <View className="px-4 pb-20">
        <Text className="text-[15px] font-extrabold text-[#1A1A1A] mb-3">Suggested For You</Text>
        <View className="flex-row flex-wrap justify-between">
          {products.slice(0, 8).map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </View>
      </View>
    </View>
  );
}
