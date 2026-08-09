import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import ProductCard, { ProductProps } from '../components/ProductCard';
import { HugeIcon } from '../components/HugeIcon';
import { ArrowLeft01Icon, ShoppingBag01Icon } from '@hugeicons/core-free-icons';

type RouteParams = {
  CategoryProducts: {
    categoryId: string;
    categoryName?: string;
    subCategory?: string;
  };
};

export default function CategoryProductsScreen() {
  const route = useRoute<RouteProp<RouteParams, 'CategoryProducts'>>();
  const navigation = useNavigation<any>();
  const { categoryId, categoryName, subCategory } = route.params;

  const [products, setProducts] = useState<ProductProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);
        // Fetch all products to allow flexible case-insensitive matching
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsData: ProductProps[] = [];

        const targetCategoryId = (categoryId || '').toLowerCase();
        const targetCategoryName = (categoryName || '').toLowerCase();
        const targetSubCategory = (subCategory || '').toLowerCase();

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'Out of Stock' || data.isActive === false) return;
          
          const dbCategory = (data.category || '').toLowerCase();
          const dbSubCategory = (data.subCategory || data.subcategory || '').toLowerCase();
          const dbName = (data.name || '').toLowerCase();

          let isMatch = false;

          // 1. Direct match on category ID or Name
          if (dbCategory === targetCategoryId || dbCategory === targetCategoryName || dbCategory.includes(targetCategoryId)) {
            isMatch = true;
          }

          // 2. Map generic admin categories like "Fashion" to "men", "women", "kids"
          if (targetCategoryId === 'men' || targetCategoryId === 'women' || targetCategoryId === 'kids') {
            if (dbCategory.includes('fashion') || dbCategory.includes('clothing')) isMatch = true;
          }

          // 3. Map generic admin categories like "Kitchen" to "home"
          if (targetCategoryId === 'home' || targetCategoryName.includes('home')) {
            if (dbCategory.includes('kitchen') || dbCategory.includes('home')) isMatch = true;
          }

          // 4. If a subCategory was clicked, ensure it matches somewhere
          if (targetSubCategory) {
            // If the product has a specific subCategory, check it
            if (dbSubCategory && !dbSubCategory.includes(targetSubCategory) && !targetSubCategory.includes(dbSubCategory)) {
               // Subcategory mismatch, but wait, maybe the product name has it
               if (!dbName.includes(targetSubCategory)) {
                  isMatch = false; // Override to false if it doesn't match subcategory specifically
               }
            } else if (!dbSubCategory) {
               // If product has NO subcategory, we can just show it if it matched the main category,
               // OR we can require the name to match the subcategory to be more precise
               if (dbName.includes(targetSubCategory) || targetSubCategory.includes('all')) {
                  isMatch = true;
               } else {
                  // For better UX, if no strict subcategory match, still show it if it matched main category
                  // so the screen isn't empty.
               }
            }
          }

          if (isMatch) {
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
          }
        });

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
          <HugeIcon icon={ArrowLeft01Icon} size={24} color="#1A1A1A" />
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
              <HugeIcon icon={ShoppingBag01Icon} size={64} color="#E0E0E0" />
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
