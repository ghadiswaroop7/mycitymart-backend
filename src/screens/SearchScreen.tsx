import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, ActivityIndicator, TouchableOpacity, Keyboard, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HugeIcon } from '../components/HugeIcon';
import { Search02Icon, Cancel01Icon, ClockIcon, SlidersHorizontalIcon } from '@hugeicons/core-free-icons';
import { getProducts } from '../services/firestoreService';
import ProductCard from '../components/ProductCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from '@react-navigation/native';

export default function SearchScreen() {
  const route = useRoute<any>();
  const initialQuery = route.params?.initialQuery || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isFilterVisible, setFilterVisible] = useState(false);

  // Filters
  const [sortOrder, setSortOrder] = useState('relevance'); // relevance, price_asc, price_desc
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const storedSearches = await AsyncStorage.getItem('recentSearches');
        if (storedSearches) setRecentSearches(JSON.parse(storedSearches));
      } catch (error) {
        console.log("AsyncStorage read error:", error);
      }
      
      try {
        const productsData = await getProducts();
        setAllProducts(productsData);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      if (searchQuery.trim()) {
        saveRecentSearch(searchQuery);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const saveRecentSearch = async (query: string) => {
    if (!query.trim()) return;
    try {
      const q = query.trim().toLowerCase();
      const updatedSearches = [q, ...recentSearches.filter(item => item !== q)].slice(0, 8);
      setRecentSearches(updatedSearches);
      await AsyncStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    } catch (e) {
      console.log("AsyncStorage write error:", e);
    }
  };

  const removeRecentSearch = async (query: string) => {
    const updated = recentSearches.filter(q => q !== query);
    setRecentSearches(updated);
    try {
      await AsyncStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch (e) {
      console.log("AsyncStorage write error:", e);
    }
  };

  // Filter products when debounced query or filters change
  useEffect(() => {
    let results = [...allProducts];

    if (debouncedQuery.trim()) {
      const lowerQuery = debouncedQuery.toLowerCase();
      results = results.filter(product => {
        const nameMatch = product.name?.toLowerCase().includes(lowerQuery);
        const tagsMatch = product.tags?.some((tag: string) => tag.toLowerCase().includes(lowerQuery));
        const brandMatch = product.brand?.toLowerCase().includes(lowerQuery);
        const catMatch = product.category?.toLowerCase().includes(lowerQuery);
        return nameMatch || tagsMatch || brandMatch || catMatch;
      });
    } else {
      results = []; // Hide products if no search
    }

    if (inStockOnly) {
      results = results.filter(p => p.inStock !== false);
    }

    if (priceRange.min) {
      results = results.filter(p => p.price >= Number(priceRange.min));
    }
    if (priceRange.max) {
      results = results.filter(p => p.price <= Number(priceRange.max));
    }

    if (sortOrder === 'price_asc') {
      results.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price_desc') {
      results.sort((a, b) => b.price - a.price);
    }

    setFilteredProducts(results);
  }, [debouncedQuery, allProducts, sortOrder, inStockOnly, priceRange]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-5 pt-4 pb-2 bg-white z-10 border-b border-gray-100">
        <View className="flex-row items-center gap-3">
          <View 
            className={`flex-1 flex-row items-center bg-gray-50 rounded-lg px-3 h-12 border ${
              isFocused ? 'border-[#008B45]' : 'border-gray-200'
            }`}
          >
            <HugeIcon icon={Search02Icon} size={20} color={isFocused ? '#008B45' : '#9CA3AF'} />
            <TextInput
              className="flex-1 ml-2 text-[15px] text-gray-800 h-full"
              placeholder="Search jhat-pat..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1">
                <HugeIcon icon={Cancel01Icon} size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={() => setFilterVisible(true)} className="w-12 h-12 bg-gray-50 rounded-lg border border-gray-200 items-center justify-center">
            <HugeIcon icon={SlidersHorizontalIcon} size={20} color="#1C1C1C" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#008B45" />
        </View>
      ) : !searchQuery && isFocused && recentSearches.length > 0 ? (
        <View className="px-5 pt-4">
          <Text className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Searches</Text>
          {recentSearches.map((item, idx) => (
            <TouchableOpacity 
              key={idx} 
              onPress={() => setSearchQuery(item)}
              className="flex-row items-center justify-between py-3 border-b border-gray-100"
            >
              <View className="flex-row items-center">
                <HugeIcon icon={ClockIcon} size={16} color="#9CA3AF" />
                <Text className="ml-3 text-gray-700 text-[15px]">{item}</Text>
              </View>
              <TouchableOpacity onPress={() => removeRecentSearch(item)} className="p-2">
                <HugeIcon icon={Cancel01Icon} size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <ProductCard product={item} />}
          ListEmptyComponent={
            searchQuery.trim() !== '' ? (
              <View className="items-center justify-center mt-20 px-8">
                <Text className="text-5xl mb-4">🔎</Text>
                <Text className="text-lg font-bold text-gray-800 text-center mb-2">No items found</Text>
                <Text className="text-gray-500 text-center text-[13px]">Try searching for something else or adjusting your filters.</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Filter Modal */}
      <Modal visible={isFilterVisible} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 min-h-[50%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-800">Filters</Text>
              <TouchableOpacity onPress={() => setFilterVisible(false)}>
                <HugeIcon icon={Cancel01Icon} size={24} color="#1C1C1C" />
              </TouchableOpacity>
            </View>

            <Text className="font-bold text-gray-700 mb-3">Sort By</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {['relevance', 'price_asc', 'price_desc'].map(sort => (
                <TouchableOpacity 
                  key={sort}
                  onPress={() => setSortOrder(sort)}
                  className={`px-4 py-2 rounded-full border ${sortOrder === sort ? 'border-[#008B45] bg-red-50' : 'border-gray-200'}`}
                >
                  <Text className={sortOrder === sort ? 'text-[#008B45] font-bold' : 'text-gray-600'}>
                    {sort === 'relevance' ? 'Relevance' : sort === 'price_asc' ? 'Price: Low to High' : 'Price: High to Low'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="font-bold text-gray-700 mb-3">Price Range (₹)</Text>
            <View className="flex-row gap-4 mb-6">
              <TextInput 
                className="flex-1 h-12 bg-gray-50 border border-gray-200 rounded-lg px-4 text-gray-800"
                placeholder="Min"
                keyboardType="numeric"
                value={priceRange.min}
                onChangeText={(val) => setPriceRange(prev => ({...prev, min: val}))}
              />
              <TextInput 
                className="flex-1 h-12 bg-gray-50 border border-gray-200 rounded-lg px-4 text-gray-800"
                placeholder="Max"
                keyboardType="numeric"
                value={priceRange.max}
                onChangeText={(val) => setPriceRange(prev => ({...prev, max: val}))}
              />
            </View>

            <TouchableOpacity 
              onPress={() => setInStockOnly(!inStockOnly)}
              className={`flex-row items-center justify-between p-4 rounded-lg border ${inStockOnly ? 'border-[#008B45] bg-red-50' : 'border-gray-200'}`}
            >
              <Text className={`font-bold ${inStockOnly ? 'text-[#008B45]' : 'text-gray-700'}`}>In Stock Only</Text>
              <View className={`w-5 h-5 rounded-sm border ${inStockOnly ? 'bg-[#008B45] border-[#008B45]' : 'border-gray-300'}`} />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setFilterVisible(false)}
              className="bg-[#008B45] rounded-xl h-14 items-center justify-center mt-8"
            >
              <Text className="text-white font-bold text-lg">Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
