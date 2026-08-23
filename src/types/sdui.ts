// ─────────────────────────────────────────────────────────────
// SDUI (Server-Driven UI) Type Definitions
// Collection: sdui_pages (document ID: home, festive, deals, home_all, etc.)
// Collection: app_homepage_layout (document ID: all, women, men, kids, etc.)
// ─────────────────────────────────────────────────────────────

export type WidgetType =
  | 'zepto_eta_bar'
  | 'ZEPTO_ETA_BAR'
  | 'meesho_share_earn'
  | 'MEESHO_SHARE_EARN'
  | 'amazon_bank_offers'
  | 'AMAZON_BANK_OFFERS'
  | 'shop_the_look'
  | 'SHOP_THE_LOOK'
  | 'flash_sale'
  | 'FLASH_SALE'
  | 'COUNTDOWN_TIMER'
  | 'arch_grid'
  | 'ARCH_GRID'
  | 'tag_grid'
  | 'TAG_GRID'
  | 'tag_shaped_cards'
  | 'TAG_SHAPED_CARDS'
  | 'masonry_feed'
  | 'MASONRY_FEED'
  | 'hero_banner'
  | 'HERO_BANNER'
  | 'carousel_slider'
  | 'CAROUSEL_SLIDER'
  | 'HORIZONTAL_SCROLL'
  | 'square_grid_3x3'
  | 'SQUARE_GRID_3X3'
  | 'trust_badges'
  | 'TRUST_BADGES'
  | 'spin_wheel_reward'
  | 'SPIN_WHEEL_REWARD'
  | 'ai_recommended'
  | 'AI_RECOMMENDED';

export interface BlockStyle {
  bgColor?: string;
  textColor?: string;
  accentColor?: string;
  bgGradient?: [string, string];
  padding?: number;
  paddingHorizontal?: number;
  paddingVertical?: number;
  paddingY?: number;
  borderRadius?: number;
  marginBottom?: number;
  marginTop?: number;
  showSeeAll?: boolean;
}

export interface LayoutBlock {
  id: string;
  type: string;
  title?: string;
  subtitle?: string;
  isActive?: boolean;
  enabled?: boolean;
  order?: number;
  style?: BlockStyle;
  data: Record<string, any>;
}

export interface SDUIPageDocument {
  pageId?: string;
  title?: string;
  updatedAt?: any;
  blocks?: LayoutBlock[];
  layoutBlocks?: LayoutBlock[];
}

// ─────────────────────────────────────────────────────────────
// Specific Widget Data Types
// ─────────────────────────────────────────────────────────────

export interface ZeptoEtaBarData {
  etaMinutes?: number | string;
  locationText?: string;
  freeDeliveryThreshold?: number;
  currentCartValue?: number;
  tagline?: string;
  highlightColor?: string;
}

export interface MeeshoShareEarnData {
  title?: string;
  subtitle?: string;
  resellerMargin?: number | string;
  badgeText?: string;
  shareMessage?: string;
  buttonText?: string;
  link?: string;
}

export interface BankOfferItem {
  id?: string;
  bankName: string;
  discountText: string;
  minOrder?: number | string;
  couponCode: string;
  logoUrl?: string;
  color?: string;
}

export interface AmazonBankOffersData {
  title?: string;
  subtitle?: string;
  offers: BankOfferItem[];
}

export interface HotspotItem {
  id: string;
  xPercent: number; // 0 to 100
  yPercent: number; // 0 to 100
  productTitle: string;
  price: number;
  productId?: string;
  link?: string;
}

export interface ShopTheLookData {
  title?: string;
  subtitle?: string;
  lifestyleImageUrl: string;
  hotspots?: HotspotItem[];
  products?: any[];
}

export interface FlashSaleData {
  title?: string;
  subtitle?: string;
  endsAt?: any; // Timestamp or ISO string
  durationHours?: number;
  claimedPercent?: number;
  productIds?: string[];
  items?: any[];
  bgGradient?: [string, string];
  [key: string]: any;
}

export interface ArchGridItem {
  id?: string;
  imageUrl: string;
  title: string;
  subtitle?: string;
  tag?: string;
  link?: string;
}

export interface ArchGridData {
  title?: string;
  subtitle?: string;
  columns?: 2 | 3;
  items: ArchGridItem[];
}

export interface TagGridItem {
  id?: string;
  label?: string;
  title?: string;
  imageUrl?: string;
  img?: string;
  link?: string;
  tag?: string;
  bgColor?: string;
  textColor?: string;
}

export interface TagGridData {
  title?: string;
  subtitle?: string;
  items: TagGridItem[];
}

export interface HeroBannerItem {
  id?: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  tag?: string;
  badge?: string;
  buttonText?: string;
  ctaText?: string;
  buttonLink?: string;
  link?: string;
  bgColor?: string;
  textColor?: string;
  overlayOpacity?: number;
}

export interface HeroBannerData {
  title?: string;
  banners?: HeroBannerItem[];
  autoPlayMs?: number;
  imageUrl?: string;
  buttonText?: string;
  buttonLink?: string;
  tag?: string;
}

export interface CarouselSliderItem {
  id?: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  price?: number | string;
  originalPrice?: number | string;
  link?: string;
}

export interface CarouselSliderData {
  title?: string;
  subtitle?: string;
  items?: CarouselSliderItem[];
  productIds?: string[];
  viewAllLink?: string;
  autoPlay?: boolean;
}

export interface SquareGridItem {
  id?: string;
  title: string;
  imageUrl: string;
  link?: string;
  tag?: string;
}

export interface SquareGrid3x3Data {
  title?: string;
  subtitle?: string;
  items: SquareGridItem[];
}

export interface TrustBadgeItem {
  icon?: string;
  title: string;
  subtitle?: string;
}

export interface TrustBadgesData {
  title?: string;
  badges?: TrustBadgeItem[];
}

export interface SpinWheelRewardData {
  title?: string;
  subtitle?: string;
  rewardCoupons?: Array<{ label: string; code: string; discount: string }>;
}

export type CountdownTimerData = FlashSaleData;
export type HorizontalScrollData = CarouselSliderData & { variant?: 'product' | 'brand' | 'category'; [key: string]: any };
export type TagShapedCardsData = TagGridData;
export interface MasonryFeedData {
  title?: string;
  subtitle?: string;
  productIds?: string[];
  category?: string;
  [key: string]: any;
}
export interface AiRecommendedData {
  title?: string;
  subtitle?: string;
  algorithm?: string;
  productIds?: string[];
  [key: string]: any;
}
