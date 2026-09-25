import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { HugeIcon } from './HugeIcon';
import {
  Location01Icon,
  ChevronDownIcon,
  Search02Icon,
  Camera02Icon,
  QrCodeIcon,
  FlashIcon,
  TagIcon,
  TruckIcon,
  StoreIcon,
  Tick01Icon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons';
import { BAZAR_COLORS, BAZAR_FONTS, BAZAR_RADIUS, BAZAR_SHADOWS } from '../styles/designSystem';

interface CommerceHeaderProps {
  onQuickActionPress?: (action: 'offers' | 'flash_deals' | 'fast_delivery' | 'nearby_shops') => void;
}

export const CommerceHeader: React.FC<CommerceHeaderProps> = ({ onQuickActionPress }) => {
  const navigation = useNavigation<any>();
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [selectedAddressLabel, setSelectedAddressLabel] = useState('Home • Dombivli (East)');

  const profile = useSelector((state: RootState) => state.profile.profile);
  const user = useSelector((state: RootState) => state.auth.user);

  const displayLocation = profile?.city 
    ? `${profile.addressType || 'Home'} • ${profile.city}`
    : selectedAddressLabel;

  const quickActions = [
    { id: 'offers', label: 'Flat Offers', icon: TagIcon, color: '#C4427A', bg: '#FFF0F5' },
    { id: 'flash_deals', label: 'Flash Deals', icon: FlashIcon, color: '#FF5200', bg: '#FFF1EB' },
    { id: 'fast_delivery', label: '25-Min Quick', icon: TruckIcon, color: '#0A7E44', bg: '#E8F5EE' },
    { id: 'nearby_shops', label: 'Local Shops', icon: StoreIcon, color: '#1E3A5F', bg: '#F0F4F8' },
  ];

  const handleActionClick = (actionId: any) => {
    if (actionId === 'nearby_shops') {
      navigation.navigate('LocalShops');
    } else if (actionId === 'flash_deals') {
      if (onQuickActionPress) {
        onQuickActionPress('flash_deals');
      } else {
        navigation.navigate('CategoryProducts', { categoryId: 'flash_deals', categoryName: '⚡ Flash Deals' });
      }
    } else if (actionId === 'offers') {
      if (onQuickActionPress) {
        onQuickActionPress('offers');
      } else {
        navigation.navigate('CategoryProducts', { categoryId: 'offers', categoryName: 'Special Offers' });
      }
    } else if (actionId === 'fast_delivery') {
      if (onQuickActionPress) {
        onQuickActionPress('fast_delivery');
      } else {
        navigation.navigate('CategoryProducts', { categoryId: 'grocery', categoryName: '⚡ Quick 25-Min Essentials' });
      }
    }
  };

  return (
    <View style={styles.headerContainer}>
      {/* ── ROW 1: LOCATION + LIVE ETA BADGE ── */}
      <View style={styles.topRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setAddressModalVisible(true)}
          style={styles.locationSelector}
        >
          <View style={styles.locationIconBadge}>
            <HugeIcon icon={Location01Icon} size={15} color="#FFFFFF" />
          </View>
          <View style={{ flexShrink: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.deliveringToLabel}>Delivering to</Text>
              <HugeIcon icon={ChevronDownIcon} size={13} color="#FFFFFF" style={{ marginLeft: 3 }} />
            </View>
            <Text style={styles.addressText} numberOfLines={1}>
              {displayLocation}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Live Zepto-style ETA Promise Badge */}
        <View style={styles.etaBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.etaText}>⚡ 20–30 MINS</Text>
        </View>
      </View>

      {/* ── ROW 2: MARKETPLACE SEARCH BAR ── */}
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => navigation.navigate('Search')}
        style={styles.searchBar}
      >
        <HugeIcon icon={Search02Icon} size={19} color="#64748B" />
        <View style={styles.searchPlaceholderWrapper}>
          <Text style={styles.searchPlaceholderText} numberOfLines={1}>
            Search "Cotton Sarees", "Fresh Milk", "Earbuds"...
          </Text>
        </View>
        
        <View style={styles.searchActionsDivider} />
        
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Search')}
          style={styles.cameraIconBtn}
        >
          <HugeIcon icon={Camera02Icon} size={19} color="#0F172A" />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* ── ROW 3: QUICK ACTION MERCHANDISING PILLS ── */}
      <View style={styles.quickActionsRow}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            activeOpacity={0.85}
            onPress={() => handleActionClick(action.id)}
            style={[styles.quickActionPill, { backgroundColor: 'rgba(255, 255, 255, 0.14)' }]}
          >
            <HugeIcon icon={action.icon} size={13} color="#FFFFFF" />
            <Text style={styles.quickActionText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── ADDRESS SELECTOR MODAL ── */}
      <Modal
        visible={addressModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setAddressModalVisible(false)}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Delivery Location</Text>
              <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
                <HugeIcon icon={Cancel01Icon} size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {[
              { id: '1', title: 'Home', subtitle: 'Dombivli (East), Maharashtra - 421201' },
              { id: '2', title: 'Work', subtitle: 'MIDC Phase II, Dombivli - 421204' },
              { id: '3', title: 'Sangamner Main', subtitle: 'Shivaji Chowk, Sangamner - 422605' },
            ].map((addr) => {
              const isSelected = selectedAddressLabel.includes(addr.title);
              return (
                <TouchableOpacity
                  key={addr.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedAddressLabel(`${addr.title} • ${addr.subtitle.split(',')[0]}`);
                    setAddressModalVisible(false);
                  }}
                  style={[
                    styles.addressItem,
                    isSelected && { borderColor: BAZAR_COLORS.primary, backgroundColor: BAZAR_COLORS.primaryLight },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.addressItemTitle, isSelected && { color: BAZAR_COLORS.primary }]}>
                      {addr.title}
                    </Text>
                    <Text style={styles.addressItemSubtitle}>{addr.subtitle}</Text>
                  </View>
                  {isSelected ? <HugeIcon icon={Tick01Icon} size={18} color={BAZAR_COLORS.primary} /> : null}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => {
                setAddressModalVisible(false);
                navigation.navigate('Addresses');
              }}
              style={styles.manageAddressBtn}
            >
              <Text style={styles.manageAddressText}>+ Add New Address</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#0F172A', // Dark Slate Premium Header
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 6 : 8,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  locationIconBadge: {
    width: 30,
    height: 30,
    borderRadius: BAZAR_RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  deliveringToLabel: {
    fontFamily: BAZAR_FONTS.medium,
    fontSize: 10.5,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressText: {
    fontFamily: BAZAR_FONTS.bold,
    fontSize: 13,
    color: '#FFFFFF',
    marginTop: -1,
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BAZAR_COLORS.accentOrange,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: BAZAR_RADIUS.full,
    gap: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  etaText: {
    fontFamily: BAZAR_FONTS.extrabold,
    fontSize: 10.5,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  searchBar: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: BAZAR_RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    ...BAZAR_SHADOWS.sm,
  },
  searchPlaceholderWrapper: {
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  searchPlaceholderText: {
    fontFamily: BAZAR_FONTS.regular,
    fontSize: 12.5,
    color: '#64748B',
  },
  searchActionsDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  cameraIconBtn: {
    padding: 4,
  },
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 6,
  },
  quickActionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: BAZAR_RADIUS.full,
    gap: 4,
  },
  quickActionText: {
    fontFamily: BAZAR_FONTS.semibold,
    fontSize: 10.5,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: BAZAR_COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BAZAR_RADIUS.xl,
    borderTopRightRadius: BAZAR_RADIUS.xl,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: BAZAR_FONTS.bold,
    fontSize: 16,
    color: BAZAR_COLORS.textPrimary,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: BAZAR_RADIUS.md,
    borderWidth: 1,
    borderColor: BAZAR_COLORS.cardBorder,
    marginBottom: 10,
  },
  addressItemTitle: {
    fontFamily: BAZAR_FONTS.bold,
    fontSize: 14,
    color: BAZAR_COLORS.textPrimary,
    marginBottom: 2,
  },
  addressItemSubtitle: {
    fontFamily: BAZAR_FONTS.regular,
    fontSize: 12,
    color: BAZAR_COLORS.textSecondary,
  },
  manageAddressBtn: {
    marginTop: 6,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BAZAR_RADIUS.md,
    backgroundColor: BAZAR_COLORS.surfaceSubtle,
  },
  manageAddressText: {
    fontFamily: BAZAR_FONTS.semibold,
    fontSize: 13,
    color: BAZAR_COLORS.primary,
  },
});

export default CommerceHeader;
