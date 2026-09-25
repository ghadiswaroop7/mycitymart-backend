import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, StyleSheet, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { getUserAddresses, saveAddress, deleteAddress, setDefaultAddress } from '../services/firestoreService';
import { HugeIcon } from '../components/HugeIcon';
import { ArrowLeft01Icon, Location01Icon, Add01Icon, Delete01Icon, Tick02Icon } from '@hugeicons/core-free-icons';

export default function AddressesScreen() {
  const navigation = useNavigation<any>();
  const user = useSelector((state: RootState) => state.auth.user);
  const uid = user?.uid || 'dummy-user-id';

  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newAddress, setNewAddress] = useState({ 
    fullName: '', 
    phone: '', 
    addressLine1: '', 
    addressLine2: '', 
    city: '', 
    state: '', 
    pincode: '', 
    type: 'Home',
    latitude: 21.1458,
    longitude: 79.0882,
  });
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const data = await getUserAddresses(uid);
      setAddresses(data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [uid]);

  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setNewAddress(prev => ({
            ...prev,
            latitude: Number(latitude.toFixed(5)),
            longitude: Number(longitude.toFixed(5)),
          }));
          setIsDetectingLocation(false);
        },
        () => {
          setIsDetectingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setIsDetectingLocation(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!newAddress.fullName || !newAddress.phone || !newAddress.addressLine1 || !newAddress.city || !newAddress.pincode) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }
    setIsSaving(true);
    try {
      const isFirst = addresses.length === 0;
      await saveAddress(uid, { 
        ...newAddress, 
        latitude: Number(newAddress.latitude) || 21.1458,
        longitude: Number(newAddress.longitude) || 79.0882,
        isDefault: isFirst 
      });
      setIsModalVisible(false);
      setNewAddress({ 
        fullName: '', 
        phone: '', 
        addressLine1: '', 
        addressLine2: '', 
        city: '', 
        state: '', 
        pincode: '', 
        type: 'Home',
        latitude: 21.1458,
        longitude: 79.0882,
      });
      fetchAddresses();
    } catch (e) {
      Alert.alert('Error', 'Failed to save address');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteAddress(uid, id);
          fetchAddresses();
        } catch (e) {
          Alert.alert('Error', 'Failed to delete address');
        }
      }}
    ]);
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(uid, id);
      fetchAddresses();
    } catch (e) {
      Alert.alert('Error', 'Failed to set default address');
    }
  };

  const renderAddressItem = ({ item }: { item: any }) => {
    return (
      <View style={[styles.addressCard, item.isDefault && styles.defaultCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{item.type}</Text>
          </View>
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>

        <Text style={styles.name}>{item.fullName}</Text>
        <Text style={styles.details}>{item.addressLine1}</Text>
        {item.addressLine2 ? <Text style={styles.details}>{item.addressLine2}</Text> : null}
        <Text style={styles.details}>{item.city}, {item.state} - {item.pincode}</Text>
        <Text style={styles.phone}>📞 {item.phone}</Text>

        <View style={{ backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, alignSelf: 'flex-start', marginTop: 2, marginBottom: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#008B45' }}>
            📍 Lat: {Number(item.latitude || 21.1458).toFixed(4)}, Lng: {Number(item.longitude || 79.0882).toFixed(4)} • Zone Verified
          </Text>
        </View>

        <View style={styles.actionsRow}>
          {!item.isDefault && (
            <TouchableOpacity onPress={() => handleSetDefault(item.id)} style={styles.actionBtn}>
              <HugeIcon icon={Tick02Icon} size={16} color="#008B45" />
              <Text style={[styles.actionText, { color: '#008B45' }]}>Set Default</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => handleDeleteAddress(item.id)} style={styles.actionBtn}>
            <HugeIcon icon={Delete01Icon} size={16} color="#EF4444" />
            <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <HugeIcon icon={ArrowLeft01Icon} size={28} color="#1C1C1C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Addresses</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#008B45" />
        </View>
      ) : addresses.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconContainer}>
            <HugeIcon icon={Location01Icon} size={40} color="#008B45" />
          </View>
          <Text style={styles.emptyTitle}>No Addresses Yet</Text>
          <Text style={styles.emptySubtitle}>Add your delivery address to proceed with orders quickly.</Text>
          <TouchableOpacity onPress={() => setIsModalVisible(true)} style={styles.addButton}>
            <HugeIcon icon={Add01Icon} size={20} color="#FFF" />
            <Text style={styles.addButtonText}>Add New Address</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={addresses}
          renderItem={renderAddressItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <TouchableOpacity onPress={() => setIsModalVisible(true)} style={styles.addMoreButton}>
              <HugeIcon icon={Add01Icon} size={20} color="#008B45" />
              <Text style={styles.addMoreText}>Add Another Address</Text>
            </TouchableOpacity>
          }
        />
      )}

      {/* Add Address Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Address</Text>
            <View style={styles.inputGroup}>
              {/* GPS Auto-detect Button */}
              <TouchableOpacity 
                onPress={handleDetectLocation} 
                disabled={isDetectingLocation}
                style={{ backgroundColor: '#E8F5E9', padding: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#C8E6C9' }}
              >
                <HugeIcon icon={Location01Icon} size={16} color="#008B45" />
                <Text style={{ color: '#008B45', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>
                  {isDetectingLocation ? 'Detecting Location...' : '📍 Auto-detect GPS Location'}
                </Text>
              </TouchableOpacity>

              <TextInput style={styles.input} placeholder="Full Name*" value={newAddress.fullName} onChangeText={t => setNewAddress({ ...newAddress, fullName: t })} />
              <TextInput style={styles.input} placeholder="Phone Number*" keyboardType="phone-pad" value={newAddress.phone} onChangeText={t => setNewAddress({ ...newAddress, phone: t })} />
              <TextInput style={styles.input} placeholder="Address Line 1*" value={newAddress.addressLine1} onChangeText={t => setNewAddress({ ...newAddress, addressLine1: t })} />
              <TextInput style={styles.input} placeholder="Address Line 2 (Optional)" value={newAddress.addressLine2} onChangeText={t => setNewAddress({ ...newAddress, addressLine2: t })} />
              <View style={styles.row}>
                <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="City*" value={newAddress.city} onChangeText={t => setNewAddress({ ...newAddress, city: t })} />
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="State*" value={newAddress.state} onChangeText={t => setNewAddress({ ...newAddress, state: t })} />
              </View>
              <TextInput style={styles.input} placeholder="Pincode*" keyboardType="number-pad" value={newAddress.pincode} onChangeText={t => setNewAddress({ ...newAddress, pincode: t })} />
              
              {/* Coordinates row */}
              <View style={styles.row}>
                <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Latitude" keyboardType="numeric" value={String(newAddress.latitude)} onChangeText={t => setNewAddress({ ...newAddress, latitude: parseFloat(t) || 21.1458 })} />
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Longitude" keyboardType="numeric" value={String(newAddress.longitude)} onChangeText={t => setNewAddress({ ...newAddress, longitude: parseFloat(t) || 79.0882 })} />
              </View>
              
              <View style={styles.typeRow}>
                {['Home', 'Work', 'Other'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeChip, newAddress.type === type && styles.typeChipActive]}
                    onPress={() => setNewAddress({ ...newAddress, type })}
                  >
                    <Text style={[styles.typeChipText, newAddress.type === type && styles.typeChipTextActive]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveAddress} style={styles.saveBtn} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Address</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1C' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 24, fontWeight: 'bold', color: '#1C1C1C', marginBottom: 8 },
  emptySubtitle: { fontSize: 16, color: '#71717A', textAlign: 'center', marginBottom: 24 },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#008B45', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  addButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700', marginLeft: 8 },
  listContent: { padding: 16 },
  addressCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  defaultCard: { borderColor: '#008B45', borderWidth: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  typeBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  typeText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  defaultBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  defaultText: { fontSize: 12, fontWeight: '700', color: '#008B45' },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1C', marginBottom: 4 },
  details: { fontSize: 14, color: '#4B5563', marginBottom: 2 },
  phone: { fontSize: 14, fontWeight: '600', color: '#1C1C1C', marginTop: 8, marginBottom: 12 },
  actionsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  actionText: { fontSize: 14, fontWeight: '600', marginLeft: 4 },
  addMoreButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#E8F5E9', borderRadius: 12, marginTop: 8 },
  addMoreText: { color: '#008B45', fontSize: 16, fontWeight: '700', marginLeft: 8 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1C', marginBottom: 20 },
  inputGroup: { marginBottom: 24 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 12 },
  row: { flexDirection: 'row' },
  typeRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  typeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  typeChipActive: { borderColor: '#008B45', backgroundColor: '#E8F5E9' },
  typeChipText: { fontSize: 14, color: '#4B5563', fontWeight: '500' },
  typeChipTextActive: { color: '#008B45', fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center' },
  cancelBtnText: { color: '#4B5563', fontSize: 16, fontWeight: '600' },
  saveBtn: { flex: 2, padding: 16, borderRadius: 12, backgroundColor: '#008B45', alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
