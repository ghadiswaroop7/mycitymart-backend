import { ServerDrivenScreenLayout, CURRENT_SCHEMA_VERSION } from './sduiContracts';

export const DEFAULT_HOME_LAYOUT: ServerDrivenScreenLayout = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  screenId: 'home',
  title: 'BazarPeth Home Feed',
  version: 1,
  publishedAt: '2026-09-25T17:46:00.000Z',
  blocks: [
    // 1. Hero Carousel
    {
      id: 'default_hero_banner',
      type: 'hero_carousel',
      title: 'Grand Festive Offers',
      subtitle: 'Exclusive discounts on verified Sangamner jewellery & sarees',
      data: {
        slides: [
          {
            id: 'slide_1',
            title: '✨ Grand Festive Offers',
            subtitle: 'Exclusive discounts on verified Sangamner jewellery & sarees',
            imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
            buttonText: 'Shop Deals →',
            buttonLink: 'category/deals'
          },
          {
            id: 'slide_2',
            title: '🥦 10-Min Sangamner Express',
            subtitle: 'Farm fresh milk, vegetables & daily essentials',
            imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
            buttonText: 'Order Now →',
            buttonLink: 'category/groceries'
          }
        ]
      }
    },

    // 2. Quick Commerce Zone Categories Row
    {
      id: 'default_qc_categories',
      type: 'quick_commerce_category_row',
      title: '⚡ Quick-Commerce Categories',
      data: {
        items: [
          { id: 'qc_groc', icon: '🥦', name: 'Groceries', sub: 'Fresh Kirana', link: 'category/groceries' },
          { id: 'qc_daily', icon: '🥛', name: 'Daily Essentials', sub: 'Milk & Dairy', link: 'category/daily_dairy' },
          { id: 'qc_cafe', icon: '☕', name: 'Sangamner Café', sub: 'Snacks & Brews', link: 'category/cafe' },
          { id: 'qc_mandi', icon: '🍎', name: 'Fresh Mandi', sub: 'Veggies & Fruits', link: 'category/mandi' }
        ]
      }
    },

    // 3. Zepto ETA Bar directly under Quick-Commerce
    {
      id: 'default_eta_bar',
      type: 'zepto_eta_bar',
      title: '⚡ Delivering in 10-15 Mins to your location',
      subtitle: 'Add ₹140 more to unlock FREE Instant Delivery',
      data: {
        title: '⚡ Delivering in 10-15 Mins to your location',
        subtitle: 'Add ₹140 more to unlock FREE Instant Delivery',
        badgeText: 'EXPRESS',
        currentCartAmount: 150,
        freeDeliveryThreshold: 290,
        actionText: 'View Cart',
        actionLink: 'cart'
      }
    },

    // 4. Persistent Physical Visual Divider
    {
      id: 'default_zone_divider',
      type: 'zone_divider',
      title: '✦ BOUTIQUE & HERITAGE MARKETPLACE ✦',
      data: {
        title: '✦ BOUTIQUE & HERITAGE MARKETPLACE ✦',
        subtitle: 'Curated Artisanal Crafts • Handcrafted to Order'
      }
    },

    // 5. Boutique Spotlight
    {
      id: 'default_boutique_spotlight',
      type: 'boutique_spotlight',
      title: '✨ ROYAL HERITAGE ✨',
      subtitle: 'Boutique Spotlight',
      data: {
        title: '✨ ROYAL HERITAGE ✨',
        subtitle: 'Boutique Spotlight',
        deliveryText: '🚚 Delivery in 2-4 days, handcrafted to order',
        items: [
          {
            id: 'arch_0',
            title: 'Banarasi Brocade',
            imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop&q=80',
            price: '₹2,499',
            link: 'product/arch_0'
          },
          {
            id: 'arch_1',
            title: 'Chanderi Silk Set',
            imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&auto=format&fit=crop&q=80',
            price: '₹1,899',
            link: 'product/arch_1'
          },
          {
            id: 'arch_2',
            title: 'Kanjivaram Gold',
            imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&auto=format&fit=crop&q=80',
            price: '₹3,299',
            link: 'product/arch_2'
          }
        ],
        trustBadges: [
          { title: '100% Genuine', icon: 'shield' },
          { title: '7 Days Return', icon: 'rotate' },
          { title: 'Express Delivery', icon: 'package' }
        ]
      }
    },

    // 6. Flash Deals
    {
      id: 'default_flash_sale',
      type: 'flash_sale',
      title: '⚡ Lightning Deals',
      data: {
        title: '⚡ Lightning Deals',
        endTime: '2026-12-31T23:59:59Z',
        items: [
          { id: 'f1', title: 'A2 Gir Cow Milk 1L', price: '₹75', originalPrice: '₹90', imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80' },
          { id: 'f2', title: 'Sangamner Special Pedha 500g', price: '₹220', originalPrice: '₹260', imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&auto=format&fit=crop&q=80' }
        ]
      }
    },

    // 7. Trust Badges
    {
      id: 'default_trust_badges',
      type: 'trust_badges',
      title: 'Our Promise',
      data: {
        items: [
          { title: '100% Genuine', subtitle: 'Verified Sellers' },
          { title: '7 Days Return', subtitle: 'Hassle-Free' },
          { title: 'Express Delivery', subtitle: 'Sangamner Local' }
        ]
      }
    }
  ]
};
