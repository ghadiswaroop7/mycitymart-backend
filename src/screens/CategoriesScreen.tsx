import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import SafeImage from '../components/SafeImage';
import { HugeIcon } from '../components/HugeIcon';
import { Search01Icon, ArrowRight01Icon, StoreIcon } from '@hugeicons/core-free-icons';
import { BAZAR_COLORS, BAZAR_FONTS, BAZAR_RADIUS, BAZAR_SHADOWS } from '../styles/designSystem';

export interface FirebaseCategory {
  id: string;
  name: string;
  imageUrl?: string;
  image?: string;
  icon?: string;
  color?: string;
  order?: number;
  status?: string;
  subcategories?: string[];
  bannerUrl?: string;
}

export default function CategoriesScreen() {
  const navigation = useNavigation<any>();

  // State
  const [categories, setCategories] = useState<FirebaseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Live Sync from Firebase Firestore ('categories' collection)
  useEffect(() => {
    const q = collection(db, 'categories');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: FirebaseCategory[] = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...(doc.data() as any),
          }))
          .filter((cat) => cat.status !== 'inactive');

        // Sort by order ascending
        fetched.sort((a, b) => {
          const ordA = typeof a.order === 'number' ? a.order : 999;
          const ordB = typeof b.order === 'number' ? b.order : 999;
          return ordA - ordB;
        });

        setCategories(fetched);
        if (fetched.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(fetched[0].id);
        }
        setLoading(false);
      },
      (error) => {
        console.error('🔴 Error listening to categories in CategoriesScreen:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Currently selected category
  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCategoryId) || categories[0];
  }, [categories, selectedCategoryId]);

  // Search filter
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        (cat.subcategories && cat.subcategories.some((sub) => sub.toLowerCase().includes(q)))
    );
  }, [categories, searchQuery]);

  // Active subcategories of selected category
  const activeSubcategories = useMemo(() => {
    if (!selectedCategory) return [];
    const list = Array.isArray(selectedCategory.subcategories) ? selectedCategory.subcategories : [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((sub) => sub.toLowerCase().includes(q));
  }, [selectedCategory, searchQuery]);

  // Navigate to Category Products
  const handleOpenCategory = (cat: FirebaseCategory, subCategory?: string) => {
    navigation.navigate('CategoryProducts', {
      categoryId: cat.id,
      categoryName: cat.name,
      subCategory: subCategory || undefined,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ── HEADER & SEARCH BAR ── */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>All Categories</Text>
          <Text style={styles.categoryCountBadge}>{categories.length} Departments</Text>
        </View>

        <View style={styles.searchBar}>
          <HugeIcon icon={Search01Icon} size={18} color="#94A3B8" />
          <TextInput
            placeholder="Search categories or subcategories..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* ── LOADING STATE ── */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BAZAR_COLORS.primary} />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      ) : categories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🛍️</Text>
          <Text style={styles.emptyTitle}>No Categories Found</Text>
          <Text style={styles.emptySubtitle}>
            Categories added in the Admin Panel will appear here automatically.
          </Text>
        </View>
      ) : (
        /* ── SPLIT VIEW (Sidebar on left, Subcategories on right) ── */
        <View style={styles.splitLayout}>
          {/* Left Sidebar */}
          <View style={styles.sidebar}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sidebarContent}>
              {filteredCategories.map((cat, idx) => {
                const isSelected = selectedCategory?.id === cat.id;
                const iconColor = cat.color || '#F8FAFC';
                const imageUri = cat.imageUrl || cat.image;

                return (
                  <TouchableOpacity
                    key={cat.id || `sidebar_${idx}`}
                    activeOpacity={0.8}
                    onPress={() => setSelectedCategoryId(cat.id)}
                    style={[styles.sidebarItem, isSelected && styles.sidebarItemActive]}
                  >
                    {/* Active Left Indicator Bar */}
                    {isSelected && <View style={styles.activeIndicator} />}

                    {/* Category Icon Badge */}
                    <View style={[styles.sidebarIconBadge, { backgroundColor: iconColor }]}>
                      {imageUri ? (
                        <SafeImage
                          uri={imageUri}
                          style={styles.sidebarImage}
                          resizeMode="contain"
                          fallbackEmoji={cat.icon || '🛍️'}
                        />
                      ) : (
                        <Text style={styles.sidebarEmoji}>{cat.icon || '🛍️'}</Text>
                      )}
                    </View>

                    {/* Category Label */}
                    <Text
                      numberOfLines={2}
                      style={[styles.sidebarLabel, isSelected && styles.sidebarLabelActive]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Right Subcategories Content */}
          <View style={styles.mainContent}>
            {selectedCategory ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mainScrollContent}>
                {/* Banner / Category Hero */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => handleOpenCategory(selectedCategory)}
                  style={[styles.heroCard, { backgroundColor: selectedCategory.color || '#F1F5F9' }]}
                >
                  <View style={styles.heroInfo}>
                    <Text style={styles.heroEmoji}>{selectedCategory.icon || '🛍️'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.heroTitle} numberOfLines={2}>
                        {selectedCategory.name}
                      </Text>
                      <Text style={styles.heroSubtitle}>
                        Explore all items in this department
                      </Text>
                    </View>
                  </View>
                  <View style={styles.heroActionBtn}>
                    <Text style={styles.heroActionBtnText}>View All</Text>
                    <HugeIcon icon={ArrowRight01Icon} size={14} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>

                {/* Subcategories Section */}
                <View style={styles.subcatSection}>
                  <View style={styles.sectionHeaderRow}>
                    <HugeIcon icon={StoreIcon} size={16} color={BAZAR_COLORS.primary} />
                    <Text style={styles.sectionTitle}>Subcategories</Text>
                    <Text style={styles.subcatCount}>
                      ({activeSubcategories.length})
                    </Text>
                  </View>

                  {activeSubcategories.length > 0 ? (
                    <View style={styles.subcatGrid}>
                      {activeSubcategories.map((subName, subIdx) => (
                        <TouchableOpacity
                          key={`${selectedCategory.id}_sub_${subIdx}`}
                          activeOpacity={0.85}
                          onPress={() => handleOpenCategory(selectedCategory, subName)}
                          style={styles.subcatCard}
                        >
                          <View style={styles.subcatBadge}>
                            <Text style={styles.subcatBadgeText}>
                              {subName.substring(0, 1).toUpperCase()}
                            </Text>
                          </View>
                          <Text style={styles.subcatName} numberOfLines={2}>
                            {subName}
                          </Text>
                          <HugeIcon icon={ArrowRight01Icon} size={14} color="#CBD5E1" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.noSubcatCard}>
                      <Text style={styles.noSubcatText}>
                        No specific subcategories configured yet.
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => handleOpenCategory(selectedCategory)}
                        style={styles.browseAllBtn}
                      >
                        <Text style={styles.browseAllBtnText}>Browse All Products</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: BAZAR_FONTS.bold,
    color: '#0F172A',
  },
  categoryCountBadge: {
    fontSize: 11,
    fontFamily: BAZAR_FONTS.semibold,
    color: BAZAR_COLORS.primary,
    backgroundColor: BAZAR_COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BAZAR_RADIUS.full,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: BAZAR_RADIUS.md,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    fontFamily: BAZAR_FONTS.regular,
    color: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: BAZAR_FONTS.medium,
    fontSize: 13,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: BAZAR_FONTS.bold,
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: BAZAR_FONTS.regular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  splitLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 96,
    backgroundColor: '#F8FAFC',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  sidebarContent: {
    paddingVertical: 8,
  },
  sidebarItem: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.6)',
  },
  sidebarItemActive: {
    backgroundColor: '#FFFFFF',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
    backgroundColor: BAZAR_COLORS.primary,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  sidebarIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
  },
  sidebarImage: {
    width: 38,
    height: 38,
  },
  sidebarEmoji: {
    fontSize: 24,
  },
  sidebarLabel: {
    fontSize: 10.5,
    fontFamily: BAZAR_FONTS.medium,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 14,
  },
  sidebarLabelActive: {
    fontFamily: BAZAR_FONTS.bold,
    color: BAZAR_COLORS.primary,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainScrollContent: {
    padding: 14,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: BAZAR_RADIUS.lg,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  heroInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  heroEmoji: {
    fontSize: 34,
  },
  heroTitle: {
    fontSize: 16,
    fontFamily: BAZAR_FONTS.bold,
    color: '#0F172A',
  },
  heroSubtitle: {
    fontSize: 11,
    fontFamily: BAZAR_FONTS.regular,
    color: '#475569',
    marginTop: 2,
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: BAZAR_COLORS.primary,
    paddingVertical: 7,
    borderRadius: BAZAR_RADIUS.sm,
  },
  heroActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontFamily: BAZAR_FONTS.bold,
  },
  subcatSection: {
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: BAZAR_FONTS.bold,
    color: '#0F172A',
  },
  subcatCount: {
    fontSize: 12,
    fontFamily: BAZAR_FONTS.regular,
    color: '#94A3B8',
  },
  subcatGrid: {
    gap: 8,
  },
  subcatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BAZAR_RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    ...BAZAR_SHADOWS.sm,
  },
  subcatBadge: {
    width: 32,
    height: 32,
    borderRadius: BAZAR_RADIUS.sm,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subcatBadgeText: {
    fontSize: 13,
    fontFamily: BAZAR_FONTS.bold,
    color: BAZAR_COLORS.primary,
  },
  subcatName: {
    flex: 1,
    fontSize: 13,
    fontFamily: BAZAR_FONTS.medium,
    color: '#1E293B',
  },
  noSubcatCard: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: BAZAR_RADIUS.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
  },
  noSubcatText: {
    fontSize: 12,
    fontFamily: BAZAR_FONTS.regular,
    color: '#64748B',
    marginBottom: 12,
    textAlign: 'center',
  },
  browseAllBtn: {
    backgroundColor: BAZAR_COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BAZAR_RADIUS.sm,
  },
  browseAllBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: BAZAR_FONTS.bold,
  },
});
