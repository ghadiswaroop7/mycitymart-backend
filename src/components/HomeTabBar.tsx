import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { TAB_THEMES } from '../config/tabThemes';

interface HomeTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  accentColor?: string;
}

const TABS = ['ALL', 'MEN', 'WOMEN', 'KIDS', 'BEAUTY'];

export default function HomeTabBar({ activeTab, onTabChange, accentColor }: HomeTabBarProps) {
  return (
    <View style={{ backgroundColor: '#111827', paddingTop: 8, paddingBottom: 0 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, alignItems: 'flex-end', gap: 8 }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          const theme = TAB_THEMES[tab] || TAB_THEMES.ALL;

          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.85}
              onPress={() => onTabChange(tab)}
              style={{
                backgroundColor: isActive ? theme.gradient[0] : 'rgba(255, 255, 255, 0.1)',
                borderTopLeftRadius: isActive ? 16 : 14,
                borderTopRightRadius: isActive ? 16 : 14,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                paddingHorizontal: isActive ? 18 : 14,
                paddingTop: isActive ? 10 : 8,
                paddingBottom: isActive ? 10 : 7,
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: isActive ? 78 : 68,
                borderWidth: isActive ? 1 : 0,
                borderColor: isActive ? 'rgba(255,255,255,0.3)' : 'transparent',
                borderBottomWidth: 0,
                shadowColor: isActive ? '#000' : 'transparent',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: isActive ? 0.2 : 0,
                shadowRadius: 4,
                elevation: isActive ? 4 : 0,
              }}
            >
              <Text style={{ fontSize: isActive ? 22 : 18, marginBottom: 2 }}>
                {theme.icon}
              </Text>
              <Text
                style={{
                  fontSize: isActive ? 12 : 10,
                  color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)',
                  fontFamily: isActive ? 'Poppins_700Bold' : 'Poppins_600SemiBold',
                  letterSpacing: 0.5,
                  textAlign: 'center',
                }}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
