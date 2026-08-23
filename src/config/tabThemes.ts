export interface SubCategory {
  id: string;
  name: string;
  img: string;
}

export interface TabTheme {
  id: string;
  label: string;
  icon: string;
  gradient: [string, string];
  bgLight: string;
  accent: string;
  bannerBadgeText: string;
  defaultBannerTitle: string;
  defaultBannerSub: string;
  defaultBannerImage: string;
  curatedTitle: string;
  subCategories: SubCategory[];
  emptyStateTitle: string;
  emptyStateSub: string;
  emptyEmoji: string;
}

export const TAB_THEMES: Record<string, TabTheme> = {
  ALL: {
    id: 'ALL',
    label: 'ALL',
    icon: '🛍️',
    gradient: ['#008B45', '#00B358'],
    bgLight: '#F0FDF4',
    accent: '#008B45',
    bannerBadgeText: '🛍️ BAZARPETH SALE',
    defaultBannerTitle: 'Neighborhood Mega Festival',
    defaultBannerSub: 'Flat discounts up to 60% OFF on verified local shops',
    defaultBannerImage: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80',
    curatedTitle: 'Blockbuster Deals For You',
    subCategories: [
      { id: 'all_mall', name: 'Super Mall', img: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=200&q=80' },
      { id: 'all_fashion', name: 'Fashion & Wear', img: 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?auto=format&fit=crop&w=200&q=80' },
      { id: 'all_kirana', name: 'Daily Kirana', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80' },
      { id: 'all_gadgets', name: 'Tech & Mobiles', img: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=200&q=80' },
      { id: 'all_deals', name: '70% Deals', img: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=200&q=80' },
    ],
    emptyStateTitle: 'No Products Found',
    emptyStateSub: 'Check back later for fresh local additions!',
    emptyEmoji: '🛍️',
  },
  MEN: {
    id: 'MEN',
    label: 'MEN',
    icon: '👔',
    gradient: ['#1E3A5F', '#2D5F8A'],
    bgLight: '#F0F4F8',
    accent: '#1E3A5F',
    bannerBadgeText: '⚡ MEN\'S LUXE SALE',
    defaultBannerTitle: 'Elevate Your Everyday Style',
    defaultBannerSub: 'Casuals, ethnic & footwear from top local menswear stores',
    defaultBannerImage: 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?auto=format&fit=crop&w=800&q=80',
    curatedTitle: 'Trending in Men\'s Wear',
    subCategories: [
      { id: 'casual', name: 'Casual Wear', img: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=200&q=80' },
      { id: 'ethnic', name: 'Ethnic Kurta', img: 'https://images.unsplash.com/photo-1596455607563-ad6193f76b17?auto=format&fit=crop&w=200&q=80' },
      { id: 'footwear', name: 'Footwear', img: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=200&q=80' },
      { id: 'sports', name: 'Active & Sports', img: 'https://images.unsplash.com/photo-1556815302-0985223c6c0e?auto=format&fit=crop&w=200&q=80' },
      { id: 'watches', name: 'Watches & Gear', img: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=200&q=80' },
    ],
    emptyStateTitle: 'More Men\'s Fashion Coming Soon!',
    emptyStateSub: 'Local menswear shops are stocking up fresh collections.',
    emptyEmoji: '👔',
  },
  WOMEN: {
    id: 'WOMEN',
    label: 'WOMEN',
    icon: '👗',
    gradient: ['#8B2252', '#C4427A'],
    bgLight: '#FFF0F5',
    accent: '#C4427A',
    bannerBadgeText: '🌸 BOUTIQUE SPECIAL',
    defaultBannerTitle: 'Handcrafted Ethnic & Western',
    defaultBannerSub: 'Exclusive sarees, kurtis & boutique dresses up to 50% OFF',
    defaultBannerImage: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=800&q=80',
    curatedTitle: 'Curated Boutique Essentials',
    subCategories: [
      { id: 'saree_ethnic', name: 'Kurtis & Sarees', img: 'https://images.unsplash.com/photo-1583391733958-d25e07fac0ec?auto=format&fit=crop&w=200&q=80' },
      { id: 'western', name: 'Western Wear', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=200&q=80' },
      { id: 'footwear', name: 'Heels & Flats', img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=200&q=80' },
      { id: 'jewelry', name: 'Jewellery', img: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=200&q=80' },
      { id: 'handbags', name: 'Bags & Totes', img: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&w=200&q=80' },
    ],
    emptyStateTitle: 'More Women\'s Fashion Coming Soon!',
    emptyStateSub: 'Top local boutiques are adding new arrivals right now.',
    emptyEmoji: '👗',
  },
  KIDS: {
    id: 'KIDS',
    label: 'KIDS',
    icon: '🧸',
    gradient: ['#D97706', '#F59E0B'],
    bgLight: '#FFFBEB',
    accent: '#D97706',
    bannerBadgeText: '🎈 KIDS FESTIVAL',
    defaultBannerTitle: 'Toys, Wear & Learning Fun',
    defaultBannerSub: 'Min 30% OFF on local kidswear & toy stores',
    defaultBannerImage: 'https://images.unsplash.com/photo-1503919005314-30d93f07d82b?auto=format&fit=crop&w=800&q=80',
    curatedTitle: 'Top Kids Collections',
    subCategories: [
      { id: 'kidswear', name: 'Kidswear', img: 'https://images.unsplash.com/photo-1514090259040-c9a721d017bc?auto=format&fit=crop&w=200&q=80' },
      { id: 'toys', name: 'Toys & Games', img: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?auto=format&fit=crop&w=200&q=80' },
      { id: 'school', name: 'School & Stationery', img: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=200&q=80' },
      { id: 'babycare', name: 'Baby Care', img: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=200&q=80' },
      { id: 'kids_shoes', name: 'Cute Footwear', img: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=200&q=80' },
    ],
    emptyStateTitle: 'More Kids Products Coming Soon!',
    emptyStateSub: 'Discover toy stores and kidswear shops nearby.',
    emptyEmoji: '🧸',
  },
  BEAUTY: {
    id: 'BEAUTY',
    label: 'BEAUTY',
    icon: '💄',
    gradient: ['#6D28D9', '#8B5CF6'],
    bgLight: '#F5F3FF',
    accent: '#6D28D9',
    bannerBadgeText: '✨ GLOW FESTIVAL',
    defaultBannerTitle: 'Skincare, Makeup & Fragrance',
    defaultBannerSub: '100% authentic products from neighborhood beauty counters',
    defaultBannerImage: 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&w=800&q=80',
    curatedTitle: 'Beauty & Wellness Picks',
    subCategories: [
      { id: 'skincare', name: 'Skincare', img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=200&q=80' },
      { id: 'makeup', name: 'Makeup & Glam', img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=200&q=80' },
      { id: 'haircare', name: 'Hair Care', img: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=200&q=80' },
      { id: 'fragrance', name: 'Perfumes', img: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=200&q=80' },
      { id: 'grooming', name: 'Grooming', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=200&q=80' },
    ],
    emptyStateTitle: 'More Beauty Products Coming Soon!',
    emptyStateSub: 'Certified cosmetic partners are bringing top brands online.',
    emptyEmoji: '💄',
  },
  GROCERIES: {
    id: 'GROCERIES',
    label: 'GROCERIES',
    icon: '🥦',
    gradient: ['#15803D', '#22C55E'],
    bgLight: '#F0FDF4',
    accent: '#15803D',
    bannerBadgeText: '🥦 FRESH & DIRECT',
    defaultBannerTitle: 'Daily Kirana & Fresh Produce',
    defaultBannerSub: 'Direct from local farmers & trusted kirana wholesalers',
    defaultBannerImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    curatedTitle: 'Daily Essentials & Groceries',
    subCategories: [
      { id: 'fruits_veg', name: 'Fresh Fruits & Veg', img: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=200&q=80' },
      { id: 'dairy', name: 'Dairy & Ghee', img: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=200&q=80' },
      { id: 'spices', name: 'Spices & Masalas', img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=200&q=80' },
      { id: 'staples', name: 'Atta, Rice & Dals', img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=200&q=80' },
    ],
    emptyStateTitle: 'Fresh Groceries Coming Soon!',
    emptyStateSub: 'Local Kirana stores are updating their daily inventory.',
    emptyEmoji: '🥦',
  },
  ELECTRONICS: {
    id: 'ELECTRONICS',
    label: 'ELECTRONICS',
    icon: '⚡',
    gradient: ['#0369A1', '#0EA5E9'],
    bgLight: '#F0F9FF',
    accent: '#0369A1',
    bannerBadgeText: '⚡ TECH & GADGETS',
    defaultBannerTitle: 'Mobile Accessories & Appliances',
    defaultBannerSub: 'Top brands & genuine warranty from verified electronic stores',
    defaultBannerImage: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
    curatedTitle: 'Trending Tech & Gadgets',
    subCategories: [
      { id: 'audio', name: 'Earbuds & Audio', img: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=200&q=80' },
      { id: 'mobile_acc', name: 'Cables & Chargers', img: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=200&q=80' },
      { id: 'smartwatch', name: 'Smartwatches', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=80' },
      { id: 'appliances', name: 'Home Appliances', img: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=200&q=80' },
    ],
    emptyStateTitle: 'Electronics Coming Soon!',
    emptyStateSub: 'Local electronics dealers are stocking up.',
    emptyEmoji: '⚡',
  },
};
