import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HugeIcon } from '../components/HugeIcon';
import { ArrowLeft01Icon, FavouriteIcon, ShoppingCartIcon } from '@hugeicons/core-free-icons';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { toggleWishlist } from '../store/slices/wishlistSlice';
import { addToCart } from '../store/slices/cartSlice';
import { subscribeToWishlist, toggleWishlistItem } from '../services/firestoreService';
import ProductCard from '../components/ProductCard';

export default function WishlistScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  
  const user = useSelector((state: RootState) => state.auth.user);
  const uid = user?.uid || 'dummy-user-id';

  const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToWishlist(uid, (items) => {
      setWishlistProducts(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [uid]);

  const handleMoveToCart = async (product: any) => {
    dispatch(addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      imageUrl: product.imageUrl || (product.images && product.images[0]) || 'https://via.placeholder.com/150',
      vendor: product.brand || product.vendor || '',
      originalPrice: product.originalPrice || product.price,
    }));
    await toggleWishlistItem(uid, product);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center px-5 py-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <HugeIcon icon={ArrowLeft01Icon} size={28} color="#1C1C1C" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">My Wishlist</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#008B45" />
        </View>
      ) : wishlistProducts.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-24 h-24 bg-red-50 rounded-full items-center justify-center mb-6">
            <HugeIcon icon={FavouriteIcon} size={40} color="#008B45" fill="#008B45" />
          </View>
          <Text className="text-2xl font-bold text-gray-800 mb-2">Wishlist is empty</Text>
          <Text className="text-gray-500 text-center mb-8">Save items you love and buy them later.</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Home')}
            className="bg-[#008B45] px-8 py-4 rounded-full"
          >
            <Text className="text-white font-bold text-lg">Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={wishlistProducts}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingVertical: 16 }}
          renderItem={({ item }) => (
            <View className="w-[48%] mb-6">
              <ProductCard product={item} />
              <TouchableOpacity 
                onPress={() => handleMoveToCart(item)}
                className="mt-2 bg-gray-50 flex-row items-center justify-center py-2.5 rounded-lg border border-gray-200"
              >
                <HugeIcon icon={ShoppingCartIcon} size={16} color="#008B45" />
                <Text className="ml-2 font-bold text-[#008B45] text-[13px]">Move to Cart</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
