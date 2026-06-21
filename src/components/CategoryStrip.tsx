import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const CATEGORIES = [
  { id: '1', name: 'Grocery', icon: '🛒', colors: ['#ecfdf5', '#f0fdf4'] },     // from-emerald-50 to-green-50
  { id: '2', name: 'Fashion', icon: '👗', colors: ['#fdf2f8', '#fbcfe8'] },     // pinks
  { id: '3', name: 'Food', icon: '🍔', colors: ['#fffbeb', '#fef3c7'] },        // ambers
  { id: '4', name: 'Electronics', icon: '💻', colors: ['#eff6ff', '#dbeafe'] }, // blues
  { id: '5', name: 'Medicine', icon: '💊', colors: ['#f0fdfa', '#ccfbf1'] },    // teals
  { id: '6', name: 'Gifts', icon: '🎁', colors: ['#f5f3ff', '#ede9fe'] },       // violets
  { id: '7', name: 'Bakery', icon: '🧁', colors: ['#fff1f2', '#ffe4e6'] },      // roses
  { id: '8', name: 'Dairy', icon: '🥛', colors: ['#f0fdfa', '#ccfbf1'] },       // teals
  { id: '9', name: 'Stationery', icon: '📝', colors: ['#fef9c3', '#fef08a'] },  // yellows
  { id: '10', name: 'Beauty', icon: '💄', colors: ['#fce7f3', '#fbcfe8'] },     // pinks
  { id: '11', name: 'Pet Care', icon: '🐾', colors: ['#fef3c7', '#fde68a'] },   // ambers
  { id: '12', name: 'Home', icon: '🏠', colors: ['#e0f2fe', '#bae6fd'] },       // sky blues
];

const SECONDARY_TABS = ['All', 'Offers', 'Near Me', 'Trending', 'New Arrivals', 'Daily Essentials'];

export default function CategoryStrip() {
  const [activeTab, setActiveTab] = useState('All');

  return (
    <View className="bg-white z-40 pb-2">
      {/* Secondary Category Strip (Sticky tracking active highlights) */}
      <View className="border-b border-zinc-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 16 }}
        >
          {SECONDARY_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}>
                <Text className={`text-xs font-bold ${isActive ? 'text-[#FF5200]' : 'text-zinc-500'}`}>
                  {tab}
                </Text>
                {isActive && (
                  <View className="h-0.5 bg-[#FF5200] w-full absolute -bottom-2.5 rounded-t-full" />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Emoji Strip with Sub-Gradients */}
      <View className="mt-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat.id} className="items-center" activeOpacity={0.7}>
              <LinearGradient
                colors={cat.colors as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="w-16 h-16 rounded-full items-center justify-center shadow-sm mb-1.5"
                style={{ borderWidth: 1, borderColor: cat.colors[1] }}
              >
                <Text className="text-lg">{cat.icon}</Text>
              </LinearGradient>
              <Text
                className="font-bold text-[#1C1C1C]"
                style={{ fontSize: 9 }}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
