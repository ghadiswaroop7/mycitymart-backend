import React, { memo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { TAB_THEMES } from '../config/tabThemes';
import { BAZAR_COLORS, BAZAR_FONTS, BAZAR_RADIUS, BAZAR_SHADOWS } from '../styles/designSystem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HomeTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  accentColor?: string;
  isSticky?: boolean;
}

const TABS = ['ALL', 'WOMEN', 'MEN', 'KIDS', 'BEAUTY', 'GROCERIES', 'ELECTRONICS'];

const HomeTabBar = memo(function HomeTabBar({
  activeTab,
  onTabChange,
  accentColor,
  isSticky = false,
}: HomeTabBarProps) {
  const scrollRef = useRef<ScrollView>(null);
  const tabLayouts = useRef<{ [key: string]: { x: number; width: number } }>({});

  // Auto-scroll active tab into view whenever it changes
  useEffect(() => {
    const layout = tabLayouts.current[activeTab];
    if (layout && scrollRef.current) {
      const targetX = Math.max(0, layout.x - (SCREEN_WIDTH / 2) + (layout.width / 2));
      scrollRef.current.scrollTo({ x: targetX, animated: true });
    }
  }, [activeTab]);

  return (
    <View 
      collapsable={false}
      renderToHardwareTextureAndroid={true}
      style={[
        styles.tabBarWrapper,
        isSticky && styles.stickyTabBarWrapper,
      ]}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        nestedScrollEnabled={true}
        overScrollMode="never"
        removeClippedSubviews={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isSticky && styles.stickyScrollContent,
        ]}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          const theme = TAB_THEMES[tab] || TAB_THEMES.ALL;

          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.88}
              onPress={() => onTabChange(tab)}
              onLayout={(e) => {
                const { x, width } = e.nativeEvent.layout;
                tabLayouts.current[tab] = { x, width };
              }}
              style={[
                styles.tabPill,
                isActive ? [
                  styles.activeTabPill,
                  { backgroundColor: theme.gradient[0] },
                ] : styles.inactiveTabPill,
              ]}
            >
              <Text style={isActive ? styles.activeTabIcon : styles.inactiveTabIcon}>
                {theme.icon}
              </Text>
              <Text
                style={isActive ? styles.activeTabText : styles.inactiveTabText}
                numberOfLines={1}
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

const styles = StyleSheet.create({
  tabBarWrapper: {
    backgroundColor: '#0F172A',
    paddingTop: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  stickyTabBarWrapper: {
    backgroundColor: '#0F172A',
    paddingTop: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  scrollContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
  },
  stickyScrollContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BAZAR_RADIUS.full,
    gap: 6,
  },
  activeTabPill: {
    ...BAZAR_SHADOWS.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  inactiveTabPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...BAZAR_SHADOWS.sm,
  },
  activeTabIcon: {
    fontSize: 15,
  },
  inactiveTabIcon: {
    fontSize: 14,
  },
  activeTabText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: BAZAR_FONTS.extrabold,
    letterSpacing: 0.5,
  },
  inactiveTabText: {
    fontSize: 11.5,
    color: '#334155',
    fontFamily: BAZAR_FONTS.bold,
    letterSpacing: 0.3,
  },
});

export default HomeTabBar;
