import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, ViewStyle, Text, StyleSheet } from 'react-native';
import type { LayoutBlock, BlockStyle } from '../../types/sdui';

// Widget imports
import TrustBadgesWidget from './widgets/TrustBadgesWidget';
import HeroBannerWidget from './widgets/HeroBannerWidget';
import MasonryFeedWidget from './widgets/MasonryFeedWidget';
import ArchGridWidget from './widgets/ArchGridWidget';
import TagShapedCardsWidget from './widgets/TagShapedCardsWidget';
import HorizontalScrollWidget from './widgets/HorizontalScrollWidget';
import CountdownTimerWidget from './widgets/CountdownTimerWidget';
import AiRecommendedWidget from './widgets/AiRecommendedWidget';
import ZeptoEtaBarWidget from './widgets/ZeptoEtaBarWidget';
import MeeshoShareEarnWidget from './widgets/MeeshoShareEarnWidget';
import AmazonBankOffersWidget from './widgets/AmazonBankOffersWidget';
import ShopTheLookWidget from './widgets/ShopTheLookWidget';
import FlashSaleWidget from './widgets/FlashSaleWidget';
import SquareGrid3x3Widget from './widgets/SquareGrid3x3Widget';
import SpinWheelRewardWidget from './widgets/SpinWheelRewardWidget';
import ZoneDividerWidget from './widgets/ZoneDividerWidget';
import QuickCommerceCategoriesWidget from './widgets/QuickCommerceCategoriesWidget';
import BoutiqueSpotlightWidget from './widgets/BoutiqueSpotlightWidget';
import ProductGridWidget from './widgets/ProductGridWidget';

interface Props {
  block: LayoutBlock;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Isolated Error Boundary per widget:
 * Prevents a single corrupted widget payload from crashing the entire feed.
 */
class WidgetErrorBoundary extends Component<{ blockId: string; blockType: string; children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (__DEV__) {
      console.error(`[WidgetRenderer] Failed to render block "${this.props.blockId}" (${this.props.blockType}):`, error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return null; // Gracefully omit failed widget
    }
    return this.props.children;
  }
}

/**
 * Universal SDUI WidgetRenderer (Amazon / Flipkart / Zepto pattern)
 * 
 * Maps `block.type` to a registered React Native component.
 * Content, copy, order, and styling are entirely server-driven.
 * Old app versions gracefully skip/ignore unrecognized types without crashing.
 */
export default function WidgetRenderer({ block }: Props) {
  if (!block || !block.type) return null;

  const wrapperStyle = buildWrapperStyle(block.style);
  const typeKey = (block.type || '').toLowerCase().trim();

  const renderWidgetContent = (): ReactNode => {
    switch (typeKey) {
      // ⚡ Quick-Commerce & Express
      case 'quick_commerce_category_row':
      case 'qc_category_row':
      case 'squircle_categories':
        return <QuickCommerceCategoriesWidget data={block.data as any} style={block.style} />;

      case 'zepto_eta_bar':
      case 'eta_bar':
        return <ZeptoEtaBarWidget data={block.data as any} style={block.style} />;

      // ✦ Zone & Physical Dividers
      case 'zone_divider':
      case 'physical_divider':
        return <ZoneDividerWidget data={block.data as any} style={block.style} />;

      // 👑 Boutique & Royal Heritage
      case 'boutique_spotlight':
      case 'wedding_store_3x3_jharokha':
        return <BoutiqueSpotlightWidget data={block.data as any} style={block.style} />;

      case 'arch_grid':
      case 'fresh_arrivals_arch_vault':
        return <ArchGridWidget data={block.data as any} style={block.style} />;

      // 🛍️ Product Catalog & Grids
      case 'product_grid':
      case 'product_carousel':
      case 'bestsellers':
        return <ProductGridWidget data={block.data as any} style={block.style} />;

      case 'masonry_feed':
      case 'split_brand_deals':
      case 'amazon_bento_499':
        return <MasonryFeedWidget data={block.data as any} />;

      // 🖼️ Hero Banners & Stories
      case 'hero_carousel':
      case 'hero_banner':
        return <HeroBannerWidget data={block.data as any} />;

      case 'carousel_slider':
      case 'horizontal_scroll':
        return <HorizontalScrollWidget data={block.data as any} />;

      // 🏷️ Deals, Badges & Gamification
      case 'trust_badges':
        return <TrustBadgesWidget data={block.data as any} />;

      case 'flash_sale':
      case 'countdown_timer':
        return <FlashSaleWidget data={block.data as any} style={block.style} />;

      case 'meesho_share_earn':
      case 'share_earn':
      case 'reseller_earn':
        return <MeeshoShareEarnWidget data={block.data as any} style={block.style} />;

      case 'amazon_bank_offers':
      case 'bank_offers':
      case 'payment_offers':
        return <AmazonBankOffersWidget data={block.data as any} style={block.style} />;

      case 'shop_the_look':
      case 'lookbook':
        return <ShopTheLookWidget data={block.data as any} style={block.style} />;

      case 'square_grid_3x3':
      case 'square_grid':
      case 'category_grid':
        return <SquareGrid3x3Widget data={block.data as any} style={block.style} />;

      case 'spin_wheel_reward':
      case 'spin_wheel':
      case 'lucky_draw':
        return <SpinWheelRewardWidget data={block.data as any} style={block.style} />;

      case 'tag_grid':
      case 'tag_shaped_cards':
      case 'price_cutout_badges':
        return <TagShapedCardsWidget data={block.data as any} style={block.style} />;

      case 'ai_recommended':
        return <AiRecommendedWidget data={block.data as any} />;

      default:
        // Graceful skip for forward compatibility with newer backend widgets
        if (__DEV__) {
          console.warn(`[WidgetRenderer] Skipping unknown widget type: "${block.type}" (id: ${block.id})`);
        }
        return null;
    }
  };

  const content = renderWidgetContent();
  if (!content) return null;

  return (
    <WidgetErrorBoundary blockId={block.id} blockType={block.type}>
      <View style={wrapperStyle}>{content}</View>
    </WidgetErrorBoundary>
  );
}

/**
 * Builds container ViewStyle from block.style.
 */
function buildWrapperStyle(style?: BlockStyle): ViewStyle {
  if (!style) return {};

  const result: ViewStyle = {};

  if (style.bgColor) result.backgroundColor = style.bgColor;
  if (style.borderRadius !== undefined) result.borderRadius = style.borderRadius;
  if (style.marginBottom !== undefined) result.marginBottom = style.marginBottom;
  if (style.marginTop !== undefined) result.marginTop = style.marginTop;

  if (style.padding !== undefined) {
    result.padding = style.padding;
  } else {
    if (style.paddingHorizontal !== undefined) result.paddingHorizontal = style.paddingHorizontal;
    if (style.paddingVertical !== undefined) result.paddingVertical = style.paddingVertical;
    if (style.paddingY !== undefined) result.paddingVertical = style.paddingY;
  }

  return result;
}
