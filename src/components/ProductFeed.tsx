import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import ProductCard, { ProductProps } from './ProductCard';

export interface ProductFeedProps {
  products?: ProductProps[];
}

export default function ProductFeed({ products: externalProducts }: ProductFeedProps) {
  const [localProducts, setLocalProducts] = useState<ProductProps[]>([]);
  const [loading, setLoading] = useState(externalProducts === undefined);

  useEffect(() => {
    if (externalProducts !== undefined) {
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsData: ProductProps[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Filter strictly for active items
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
        
        setLocalProducts(productsData);
      } catch (error) {
        console.error("Error fetching products: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [externalProducts]);

  const displayProducts = externalProducts !== undefined ? externalProducts : localProducts;

  return (
    <View className="mt-4 px-4">
      <Text className="text-xl font-extrabold text-navyDark mb-4">Trending Near You 🔥</Text>
      
      {loading ? (
        <View className="py-10 items-center justify-center">
          <ActivityIndicator size="large" color="#FF5200" />
        </View>
      ) : (
        <View className="flex-row flex-wrap justify-between">
          {displayProducts.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
          
          {displayProducts.length === 0 && (
            <Text className="text-gray-500 text-center w-full mt-4">
              No products found in the database.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
