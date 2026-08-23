import { Linking } from 'react-native';

/**
 * Universal Deep Link Parser & Navigator for SDUI and Homepage CMS
 * Handles links like:
 * - `category/men`
 * - `category/sarees`
 * - `product/prod_123`
 * - `shop/shop_abc`
 * - `deals` / `flash_sale`
 * - `cart`
 * - `search?q=butter`
 * - `https://...`
 */
export function handleSDUILink(link: string | undefined | null, navigation: any, fallbackTitle?: string) {
  if (!link || typeof link !== 'string') return;
  const cleanLink = link.trim();
  if (!cleanLink) return;

  // External URLs
  if (cleanLink.startsWith('http://') || cleanLink.startsWith('https://')) {
    Linking.openURL(cleanLink).catch((err) => console.error('Error opening external link:', err));
    return;
  }

  // Search links: `search?q=shoes` or `search`
  if (cleanLink.startsWith('search')) {
    const queryMatch = cleanLink.match(/search\?q=(.+)/i);
    const query = queryMatch ? decodeURIComponent(queryMatch[1]) : '';
    navigation.navigate('Search', { initialQuery: query });
    return;
  }

  // Product links: `product/prod_123` or `products/prod_123`
  if (cleanLink.startsWith('product/') || cleanLink.startsWith('products/')) {
    const productId = cleanLink.split('/')[1];
    if (productId) {
      navigation.navigate('ProductDetail', { productId });
    }
    return;
  }

  // Category links: `category/men` or `categories/women_western`
  if (cleanLink.startsWith('category/') || cleanLink.startsWith('categories/')) {
    const parts = cleanLink.split('/');
    const categoryId = parts[1] || 'all';
    const categoryName = fallbackTitle || categoryId.replace(/_/g, ' ').toUpperCase();
    navigation.navigate('CategoryProducts', { categoryId, categoryName });
    return;
  }

  // Local Shop links: `shop/xyz` or `shops/xyz`
  if (cleanLink.startsWith('shop/') || cleanLink.startsWith('shops/')) {
    const shopId = cleanLink.split('/')[1];
    if (shopId) {
      navigation.navigate('ShopDetail', { shopId });
    }
    return;
  }

  // Specific Tabs & Screens
  if (cleanLink === 'cart') {
    navigation.navigate('MainTabs', { screen: 'Cart' });
    return;
  }
  if (cleanLink === 'shops' || cleanLink === 'feriwala' || cleanLink === 'local_shops') {
    navigation.navigate('MainTabs', { screen: 'Feriwala' });
    return;
  }
  if (cleanLink === 'categories') {
    navigation.navigate('MainTabs', { screen: 'Categories' });
    return;
  }
  if (cleanLink === 'deals' || cleanLink === 'flash_sale' || cleanLink === 'offers') {
    navigation.navigate('CategoryProducts', {
      categoryId: 'men',
      categoryName: '🔥 Today Flash Deals & Offers',
    });
    return;
  }

  // Fallback: Check if it's a category id directly
  navigation.navigate('CategoryProducts', {
    categoryId: cleanLink,
    categoryName: fallbackTitle || cleanLink.replace(/_/g, ' ').toUpperCase(),
  });
}
