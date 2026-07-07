import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { HugeIcon } from './HugeIcon';
import { StarIcon, ClockIcon, SecurityCheckIcon, AwardIcon } from '@hugeicons/core-free-icons';

export default function LocalShopsFeed() {
  const [shops, setShops] = useState<any[]>([]);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const q = query(collection(db, 'local_shops'), where('isActive', '==', true));
        const snapshot = await getDocs(q);
        const shopsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setShops(shopsData);
      } catch (error) {
        console.error("Error fetching shops:", error);
      }
    };
    fetchShops();
  }, []);

  if (shops.length === 0) return null;

  // Fallback theme colors
  const THEME_COLORS = ['#FF5200', '#10b981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'];

  return (
    <View className="mb-6 mt-2">
      <View className="flex-row items-center justify-between px-5 mb-3">
        <Text className="text-lg font-extrabold text-[#1C1C1C]">Local Shops Near You 🏪</Text>
        <TouchableOpacity>
          <Text className="text-xs font-bold text-[#FF5200]">See All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ paddingHorizontal: 16 }}
        snapToInterval={155 + 12} // width + margin
        decelerationRate="fast"
      >
        {shops.map((shop, index) => {
          const themeColor = shop.themeColor || THEME_COLORS[index % THEME_COLORS.length];

          return (
            <TouchableOpacity
              key={shop.id}
              className="bg-white rounded-2xl mr-3 shadow-sm border border-zinc-100 overflow-visible relative"
              style={{ width: 155, height: 235 }}
              activeOpacity={0.9}
            >
              {/* Top Cover with Theme Color (55%) */}
              <View
                className="w-full items-center justify-center relative rounded-t-2xl overflow-hidden"
                style={{ backgroundColor: themeColor, height: '55%' }}
              >
                {(() => {
                  const imageUri = shop.image || shop.imageUrl || shop.banner || shop.logo || shop.avatarUrl;
                  return imageUri && typeof imageUri === 'string' && imageUri.trim().length > 0 ? (
                    <Image
                      source={{ uri: imageUri }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text className="text-4xl">🏪</Text>
                  );
                })()}

                {/* Verified Badge Overlay */}
                {shop.isVerified && (
                  <View className="absolute top-2 right-2 bg-[#1C1C1C] rounded-full p-1" style={{ elevation: 2 }}>
                    <HugeIcon icon={SecurityCheckIcon} size={12} color="#FFFFFF" />
                  </View>
                )}
              </View>

              {/* Featured Ribbon Overlay (Requires overflow-visible on parent) */}
              {shop.isFeatured && (
                <View 
                  className="absolute top-9 bg-[#FF5200] px-2 py-0.5 rounded-r-md z-10 shadow-sm"
                  style={{ left: -4, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }}
                >
                  <View className="flex-row items-center">
                    <HugeIcon icon={AwardIcon} size={10} color="#FFFFFF" />
                    <Text className="text-white text-[9px] font-extrabold ml-1">FEATURED</Text>
                  </View>
                  {/* Fold effect for ribbon */}
                  <View className="absolute -bottom-1 left-0 border-t-4 border-l-4 border-transparent border-t-[#CC4200]" />
                </View>
              )}

              {/* Card Body (45%) */}
              <View className="p-3 justify-between" style={{ height: '45%' }}>
                <View>
                  <Text className="text-sm font-extrabold text-[#1C1C1C] mb-1 leading-tight" numberOfLines={2}>
                    {shop.name}
                  </Text>
                  
                  {/* Rating Row */}
                  <View className="flex-row items-center mb-2">
                    <HugeIcon icon={StarIcon} size={11} color="#F59E0B" fill="#F59E0B" />
                    <Text className="text-[10px] text-[#1C1C1C] font-bold ml-1">
                      {shop.rating || '4.0'}
                    </Text>
                    <View className="w-0.5 h-2.5 bg-zinc-300 mx-1.5 rounded-full" />
                    <Text className="text-[10px] text-zinc-500 font-medium" numberOfLines={1}>
                      {shop.category || 'General'}
                    </Text>
                  </View>
                </View>

                {/* Delivery Time Pill */}
                <View className="bg-[#FFF3EE] self-start px-2 py-1 rounded-md flex-row items-center mt-auto">
                  <HugeIcon icon={ClockIcon} size={10} color="#FF5200" />
                  <Text className="text-[10px] text-[#FF5200] font-bold ml-1">
                    {shop.deliveryTime || '15-20 min'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
