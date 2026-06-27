import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import ProductCard, { ProductProps } from '../components/ProductCard';
import { HugeIcon } from '../components/HugeIcon';
import * as Hugeicons from '@hugeicons/core-free-icons';

type RouteParams = {
  CategoryProducts: {
    categoryId: string;
    categoryName?: string;
  };
};

export default function CategoryProductsScreen() {
  const route = useRoute<RouteProp<RouteParams, 'CategoryProducts'>>();
  const navigation = useNavigation<any>();
  const { categoryId, categoryName } = route.params;

  const [products, setProducts] = useState<ProductProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);
        // Query products where category matches categoryId
        const q = query(
          collection(db, 'products'),
          where('category', '==', categoryId)
        );
        const querySnapshot = await getDocs(q);
        const productsData: ProductProps[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'Out of Stock' || data.isActive === false) return;

          productsData.push({
            id: doc.id,
            name: data.name || 'Unnamed Product',
            price: data.price || 0,
            originalPrice: data.originalPrice || 0,
            rating: data.rating || 0,
            vendor: data.vendor || data.shop_name || 'Unknown Vendor',
            imageUrl: data.images?.[0] || data.imageUrl || undefined,
            deliveryTime: data.deliveryTime || '20 MINS',
          });
        });

        // If no products found by categoryId, we could optionally try by categoryName,
        // but let's stick to categoryId first.
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching category products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [categoryId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 16, 
        paddingVertical: 12, 
        borderBottomWidth: 1, 
        borderBottomColor: '#F0F0F0' 
      }}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={{ padding: 8, marginRight: 8, marginLeft: -8 }}
        >
          <HugeIcon icon={Hugeicons.ArrowLeft01Icon} size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontFamily: 'Poppins-SemiBold', color: '#1A1A1A' }}>
          {categoryName || 'Category Products'}
        </Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FF5200" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 12 }}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
              <HugeIcon icon={Hugeicons.ShoppingBag01Icon} size={64} color="#E0E0E0" />
              <Text style={{ marginTop: 16, fontSize: 16, fontFamily: 'Poppins-Medium', color: '#666' }}>
                No products found in this category.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ width: '48%' }}>
              <ProductCard product={item} />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
