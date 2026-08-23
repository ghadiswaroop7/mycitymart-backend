import React from 'react';
import { View, ViewStyle } from 'react-native';
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

interface Props {
  block: LayoutBlock;
}

/**
 * Maps a LayoutBlock from Firestore to the appropriate SDUI Widget component.
 * Supports both snake_case (e.g. `zepto_eta_bar`) and UPPER_CASE (e.g. `ZEPTO_ETA_BAR`).
 */
export default function WidgetRenderer({ block }: Props) {
  const wrapperStyle = buildWrapperStyle(block.style);
  const typeKey = (block.type || '').toLowerCase().trim();

  const widget = (() => {
    switch (typeKey) {
      case 'zepto_eta_bar':
      case 'eta_bar':
        return <ZeptoEtaBarWidget data={block.data as any} style={block.style} />;

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

      case 'flash_sale':
      case 'countdown_timer':
        return <FlashSaleWidget data={block.data as any} style={block.style} />;

      case 'arch_grid':
        return <ArchGridWidget data={block.data as any} style={block.style} />;

      case 'tag_grid':
      case 'tag_shaped_cards':
        return <TagShapedCardsWidget data={block.data as any} style={block.style} />;

      case 'square_grid_3x3':
      case 'square_grid':
      case 'category_grid':
        return <SquareGrid3x3Widget data={block.data as any} style={block.style} />;

      case 'spin_wheel_reward':
      case 'spin_wheel':
      case 'lucky_draw':
        return <SpinWheelRewardWidget data={block.data as any} style={block.style} />;

      case 'hero_banner':
        return <HeroBannerWidget data={block.data as any} />;

      case 'carousel_slider':
      case 'horizontal_scroll':
        return <HorizontalScrollWidget data={block.data as any} />;

      case 'masonry_feed':
        return <MasonryFeedWidget data={block.data as any} />;

      case 'trust_badges':
        return <TrustBadgesWidget data={block.data as any} />;

      case 'ai_recommended':
        return <AiRecommendedWidget data={block.data as any} />;

      default:
        if (__DEV__) {
          console.warn(`[WidgetRenderer] Unknown block type: "${block.type}" (id: ${block.id})`);
        }
        return null;
    }
  })();

  if (!widget) return null;

  return <View style={wrapperStyle}>{widget}</View>;
}

/**
 * Converts the Firestore BlockStyle into a React Native ViewStyle.
 */
function buildWrapperStyle(style?: BlockStyle): ViewStyle {
  if (!style) return { marginBottom: 16 };

  return {
    backgroundColor: style.bgColor || undefined,
    padding: style.padding,
    paddingHorizontal: style.paddingHorizontal,
    paddingVertical: style.paddingVertical ?? style.paddingY,
    borderRadius: style.borderRadius,
    marginBottom: style.marginBottom ?? 16,
    marginTop: style.marginTop,
    overflow: style.borderRadius ? 'hidden' : undefined,
  };
}
