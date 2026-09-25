/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * BAZARPETH — Universal SDUI Contract (Single Source of Truth)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Shared contract defining the Server-Driven UI specification across:
 *   1. Customer Mobile App (React Native SDUI Engine)
 *   2. Admin Studio (Page Builder & Canvas Preview)
 *   3. Firestore Backend (published_pages, drafts, page_versions)
 *
 * Principles:
 *   - Schema Versioned: Every layout carries schemaVersion ('2.0.0')
 *   - Graceful Degradation: Unknown widget types are skipped, never crashing the app
 *   - Targeting: Blocks and layouts carry zone/city/segment rules
 */

export const CURRENT_SCHEMA_VERSION = '2.0.0';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Supported Canonical Widget Types
// ─────────────────────────────────────────────────────────────────────────────
export const SUPPORTED_WIDGET_TYPES = [
  // Quick-Commerce & Express
  'zepto_eta_bar',
  'eta_bar',
  'quick_commerce_category_row',
  'qc_category_row',
  'fresh_at_5_strip',
  'budget_strip',
  'zepto_cafe_menu',
  'floating_cart_pill',
  'floating_cart_free_delivery',

  // Zone & Physical Dividers
  'zone_divider',
  'physical_divider',

  // Boutique, Heritage & Luxury
  'boutique_spotlight',
  'wedding_store_3x3_jharokha',
  'arch_grid',
  'fresh_arrivals_arch_vault',
  'shop_the_look',
  'gold_premium_collection',

  // Core Marketplace & Banners
  'hero_carousel',
  'hero_banner',
  'trust_badges',
  'product_grid',
  'product_carousel',
  'masonry_feed',
  'split_brand_deals',
  'amazon_bento_499',
  'square_grid_3x3',
  'category_stories',
  'explore_categories_grid',

  // Deals & Gamification
  'flash_sale',
  'countdown_timer',
  'spin_wheel_reward',
  'price_cutout_badges',
  'meesho_share_earn',
  'amazon_bank_offers',
  'ai_recommended',
] as const;

export type SupportedWidgetType = typeof SUPPORTED_WIDGET_TYPES[number];

/**
 * Checks whether a widget type string is recognized by the current mobile app build.
 */
export function isWidgetTypeSupported(type: string): boolean {
  if (!type) return false;
  const normalized = type.toLowerCase().trim();
  return SUPPORTED_WIDGET_TYPES.some(t => t.toLowerCase() === normalized);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Targeting & Context Types
// ─────────────────────────────────────────────────────────────────────────────
export interface TargetingRule {
  /** Target cities, e.g. ['Sangamner', 'Pune']. ['all'] or empty means all cities. */
  cities?: string[];
  /** Target user segments: ['new_user', 'returning', 'vip', 'all'] */
  userSegments?: string[];
  /** Minimum mobile app semantic version required to render this block (e.g. '1.0.0') */
  minAppVersion?: string;
  /** Maximum mobile app semantic version */
  maxAppVersion?: string;
}

export interface UserTargetingContext {
  city?: string;
  userSegment?: string;
  appVersion?: string;
}

/**
 * Evaluates whether a block or layout meets the current user's targeting criteria.
 * Returns true if the block should be shown, false if it should be skipped.
 */
export function evaluateTargeting(
  targeting?: TargetingRule,
  context?: UserTargetingContext
): boolean {
  if (!targeting) return true;

  // City targeting check
  if (targeting.cities && Array.isArray(targeting.cities) && targeting.cities.length > 0) {
    const targetAll = targeting.cities.some(c => c.toLowerCase() === 'all' || c === '*');
    if (!targetAll && context?.city) {
      const userCity = context.city.toLowerCase().trim();
      const cityMatches = targeting.cities.some(c => c.toLowerCase().trim() === userCity);
      if (!cityMatches) return false;
    }
  }

  // User segment check
  if (targeting.userSegments && Array.isArray(targeting.userSegments) && targeting.userSegments.length > 0) {
    const targetAllSegments = targeting.userSegments.some(s => s.toLowerCase() === 'all' || s === '*');
    if (!targetAllSegments && context?.userSegment) {
      const userSeg = context.userSegment.toLowerCase().trim();
      const segmentMatches = targeting.userSegments.some(s => s.toLowerCase().trim() === userSeg);
      if (!segmentMatches) return false;
    }
  }

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Layout Block & Page Document Interfaces
// ─────────────────────────────────────────────────────────────────────────────
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
  targeting?: TargetingRule;
  style?: BlockStyle;
  data: Record<string, any>;
}

export interface ServerDrivenScreenLayout {
  schemaVersion: string;
  screenId: string;
  title?: string;
  version?: number;
  publishedAt?: string;
  publishedBy?: string;
  targeting?: TargetingRule;
  cardShapeSettings?: {
    borderRadius?: number;
    shadowStyle?: string;
    cardGap?: number;
  };
  blocks: LayoutBlock[];
  metadata?: Record<string, any>;
}
