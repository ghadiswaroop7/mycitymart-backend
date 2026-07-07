import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';

interface HomeTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = ['ALL', 'MEN', 'WOMEN', 'KIDS', 'BEAUTY'];

export default function HomeTabBar({ activeTab, onTabChange }: HomeTabBarProps) {
  return (
    <View className="bg-white border-b border-gray-200">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => onTabChange(tab)}
              className="py-3 px-4 relative"
            >
              <Text 
                className={`text-[13px] tracking-wide ${isActive ? 'text-[#008B45] font-extrabold' : 'text-gray-500 font-bold'}`}
              >
                {tab}
              </Text>
              {isActive && (
                <View className="absolute bottom-0 left-4 right-4 h-1 bg-[#008B45] rounded-t-full" />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
