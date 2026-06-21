import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Animated, Easing } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { HugeIcon } from './HugeIcon';
import { FlashIcon, ClockIcon } from '@hugeicons/core-free-icons';

export default function FlashDealsFeed() {
  const [deals, setDeals] = useState<any[]>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulsing animation for the Zap icon
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const q = query(collection(db, 'products'), where('isFlashDeal', '==', true));
        const snapshot = await getDocs(q);
        const dealsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDeals(dealsData);
      } catch (error) {
        console.error("Error fetching flash deals:", error);
      }
    };
    fetchDeals();
  }, []);

  if (deals.length === 0) return null;

  return (
    <View className="bg-zinc-950 py-5 mb-6">
      {/* Section Header */}
      <View className="flex-row items-center px-5 mb-4">
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <HugeIcon icon={FlashIcon} size={20} color="#FBBF24" fill="#FBBF24" />
        </Animated.View>
        <Text className="text-lg font-extrabold text-white ml-2">Flash Deals</Text>
        <View className="ml-2 bg-yellow-400/20 px-2 py-0.5 rounded-full">
          <Text className="text-[10px] font-extrabold text-yellow-400">LIMITED TIME</Text>
        </View>
      </View>

      {/* Deals Horizontal Scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {deals.map((deal) => {
          const soldStock = deal.soldStock || 0;
          const totalStock = deal.totalStock || 100;
          const soldPercent = Math.min((soldStock / totalStock) * 100, 100);
          const discount = deal.originalPrice > 0
            ? Math.round(((deal.originalPrice - deal.price) / deal.originalPrice) * 100)
            : 0;
          const imageUrl = deal.images?.[0] || deal.imageUrl;

          return (
            <TouchableOpacity
              key={deal.id}
              className="bg-zinc-900 rounded-2xl mr-3 overflow-hidden border border-zinc-800"
              style={{ width: 155 }}
              activeOpacity={0.9}
            >
              {/* Image */}
              <View className="w-full h-28 bg-zinc-800 relative">
                {imageUrl && typeof imageUrl === 'string' && imageUrl.length > 0 ? (
                  <Image source={{ uri: imageUrl }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <View className="w-full h-full items-center justify-center">
                    <HugeIcon icon={FlashIcon} size={28} color="#FBBF24" />
                  </View>
                )}

                {/* Discount Badge */}
                {discount > 0 ? (
                  <View className="absolute top-2 left-2 bg-red-500 px-1.5 py-0.5 rounded-md">
                    <Text className="text-white text-[10px] font-extrabold">-{discount}%</Text>
                  </View>
                ) : null}
              </View>

              {/* Card Body */}
              <View className="p-3">
                <Text className="text-xs font-bold text-white mb-1" numberOfLines={2}>
                  {deal.name}
                </Text>

                {/* Price Row */}
                <View className="flex-row items-center mb-2">
                  <Text className="text-sm font-extrabold text-white">₹{deal.price}</Text>
                  {deal.originalPrice > deal.price && (
                    <Text className="text-[10px] text-zinc-500 line-through ml-1.5">₹{deal.originalPrice}</Text>
                  )}
                </View>

                {/* Stock Progress Bar */}
                <View className="mb-1.5">
                  <View className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${soldPercent}%`,
                        backgroundColor: soldPercent > 70 ? '#EF4444' : soldPercent > 40 ? '#F59E0B' : '#10B981',
                      }}
                    />
                  </View>
                  <Text className="text-[9px] text-zinc-500 font-bold mt-1">
                    {soldStock}/{totalStock} sold
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
