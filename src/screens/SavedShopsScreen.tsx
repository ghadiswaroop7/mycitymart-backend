import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { subscribeToSavedShops, toggleSavedShop } from '../services/firestoreService';
import { HugeIcon } from '../components/HugeIcon';
import { ArrowLeft01Icon, StoreIcon, StarIcon } from '@hugeicons/core-free-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - CARD_GAP) / 2;

const COLORS = {
  orange: '#FA8C16',
  warmBg: '#FFF8F0',
  cardBg: '#FFFFFF',
  textPrimary: '#1C1C1C',
  textMuted: '#71717A',
  openGreen: '#16A34A',
  openGreenBg: '#F0FFF4',
  closedGrey: '#9CA3AF',
  closedGreyBg: '#F4F4F5',
};

const ShopCardItem = React.memo(({ shop, onPress }: { shop: any; onPress: () => void }) => {
  const shopName = shop.shopName || shop.name || 'Local Shop';
  const ownerName = shop.ownerName || shop.owner || '';
  const shopCategory = shop.category || 'General';
  const shopRating = shop.rating || 4.0;
  const shopImage = shop.image || shop.imageUrl || shop.banner || shop.logo || shop.avatarUrl || '';
  const isOpen = shop.isOpen !== undefined ? shop.isOpen : (shop.isActive !== false);

  return (
    <View style={{ width: CARD_WIDTH }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
      >
        <View style={styles.shopCard}>
          <View style={styles.shopImageContainer}>
            {shopImage ? (
              <Image source={{ uri: shopImage }} style={styles.shopImage} resizeMode="cover" />
            ) : (
              <View style={styles.shopImagePlaceholder}>
                <Text style={{ fontSize: 36 }}>🏪</Text>
              </View>
            )}

            <TouchableOpacity 
              onPress={shop.onToggleSave}
              style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 16, width: 28, height: 28, justifyContent: 'center', alignItems: 'center', zIndex: 10 }}
            >
              <HugeIcon icon={StarIcon} size={16} color="#FA8C16" fill="#FA8C16" />
            </TouchableOpacity>

            <View style={[
              styles.statusBadge,
              { backgroundColor: isOpen ? COLORS.openGreenBg : COLORS.closedGreyBg }
            ]}>
              <View style={[
                styles.statusDot,
                { backgroundColor: isOpen ? COLORS.openGreen : COLORS.closedGrey }
              ]} />
              <Text style={[
                styles.statusText,
                { color: isOpen ? COLORS.openGreen : COLORS.closedGrey }
              ]}>
                {isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>

          <View style={styles.shopCardBody}>
            <Text style={styles.shopName} numberOfLines={1}>{shopName}</Text>
            <View style={styles.categoryChipSmall}>
              <Text style={styles.categoryChipSmallText}>{shopCategory}</Text>
            </View>
            <View style={styles.ratingRow}>
              <HugeIcon icon={StarIcon} size={12} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>{shopRating.toFixed?.(1) || shopRating}</Text>
            </View>
            {ownerName ? (
              <Text style={styles.ownerName} numberOfLines={1}>
                by {ownerName}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
});

export default function SavedShopsScreen() {
  const navigation = useNavigation<any>();
  const user = useSelector((state: RootState) => state.auth.user);
  const uid = user?.uid || 'dummy-user-id';

  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToSavedShops(uid, (savedList: any[]) => {
      setShops(savedList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [uid]);

  const handleShopPress = (shop: any) => {
    navigation.navigate('ShopDetail', { shopId: shop.id, shop });
  };

  const renderShopCard = ({ item }: { item: any }) => {
    return (
      <ShopCardItem 
        shop={{
          ...item,
          onToggleSave: () => toggleSavedShop(uid, item)
        }} 
        onPress={() => handleShopPress(item)} 
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <HugeIcon icon={ArrowLeft01Icon} size={28} color="#1C1C1C" />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>Saved Shops</Text>
      </View>

      {!loading && shops.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>🏪</Text>
          <Text style={styles.emptyTitle}>No Saved Shops</Text>
          <Text style={styles.emptySubtitle}>
            You haven't saved any local shops yet.{"\n"}
            Save your favorite shops to find them easily later.
          </Text>
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={() => navigation.navigate('Feriwala')}
          >
            <Text style={styles.exploreButtonText}>Explore Shops</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={shops}
          renderItem={renderShopCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1C',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: CARD_GAP,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: COLORS.orange,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  exploreButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  shopCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    borderColor: '#F0F0F0',
    borderWidth: 1.5,
  },
  shopImageContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
    backgroundColor: COLORS.warmBg,
  },
  shopImage: {
    width: '100%',
    height: '100%',
  },
  shopImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  shopCardBody: {
    padding: 12,
  },
  shopName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  categoryChipSmall: {
    backgroundColor: COLORS.warmBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryChipSmallText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.orange,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  ownerName: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
});
