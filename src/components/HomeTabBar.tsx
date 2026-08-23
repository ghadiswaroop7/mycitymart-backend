import React, { memo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { TAB_THEMES } from '../config/tabThemes';

interface HomeTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  accentColor?: string;
}

const TABS = ['ALL', 'WOMEN', 'MEN', 'KIDS', 'BEAUTY', 'GROCERIES', 'ELECTRONICS'];

const HomeTabBar = memo(function HomeTabBar({ activeTab, onTabChange }: HomeTabBarProps) {
  const activeTheme = TAB_THEMES[activeTab] || TAB_THEMES.ALL;

  return (
    <View 
      collapsable={false}
      renderToHardwareTextureAndroid={true}
      style={{
        backgroundColor: '#0F172A',
        paddingTop: 12,
        paddingBottom: 0,
      }}
    >
      <ScrollView
        horizontal
        nestedScrollEnabled={true}
        overScrollMode="never"
        removeClippedSubviews={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, alignItems: 'flex-end', gap: 8 }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          const theme = TAB_THEMES[tab] || TAB_THEMES.ALL;

          if (isActive) {
            // Active Tab: Solid connected folder tab that flows seamlessly into the theme container below
            return (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.95}
                onPress={() => onTabChange(tab)}
                style={{
                  backgroundColor: theme.gradient[0],
                  borderTopLeftRadius: 18,
                  borderTopRightRadius: 18,
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  paddingHorizontal: 18,
                  paddingTop: 10,
                  paddingBottom: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -3 },
                  shadowOpacity: 0.25,
                  shadowRadius: 6,
                  elevation: 6,
                }}
              >
                <Text style={{ fontSize: 18 }}>{theme.icon}</Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: '#FFFFFF',
                    fontFamily: 'Poppins_800ExtraBold',
                    letterSpacing: 0.5,
                  }}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          }

          // Inactive Tab: Clean, floating rounded pill badge
          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.8}
              onPress={() => onTabChange(tab)}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 7,
                marginBottom: 6,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <Text style={{ fontSize: 15 }}>{theme.icon}</Text>
              <Text
                style={{
                  fontSize: 11.5,
                  color: '#334155',
                  fontFamily: 'Poppins_700Bold',
                  letterSpacing: 0.3,
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
});

export default HomeTabBar;

