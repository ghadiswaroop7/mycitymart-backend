import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { HugeIcon } from '../components/HugeIcon';
import * as Hugeicons from '@hugeicons/core-free-icons';

const CATEGORY_ICONS_MAPPING: Record<string, any> = {
  popular: require('../../assets/cat_popular.png'),
  kurti_saree_lehenga: require('../../assets/cat_kurti_saree_lehenga.png'),
  women_western: require('../../assets/cat_women_western.png'),
  lingerie: require('../../assets/cat_lingerie.png'),
  men: require('../../assets/cat_men.png'),
  kids_toys: require('../../assets/cat_kids_toys.png'),
  home_kitchen: require('../../assets/cat_home_kitchen.png'),
  beauty_health: require('../../assets/cat_beauty_health.png'),
  jewellery_accessories: require('../../assets/cat_jewellery_accessories.png'),
  bags_footwear: require('../../assets/cat_bags_footwear.png'),
  electronics: require('../../assets/cat_electronics.png'),
  watches: require('../../assets/cat_watches.png'),
  sports_fitness: require('../../assets/cat_sports_fitness.png'),
  car_motorbike: require('../../assets/cat_car_motorbike.png'),
  office_supplies: require('../../assets/cat_office_supplies.png'),
  grocery: require('../../assets/cat_grocery.png'),
  books: require('../../assets/cat_books.png'),
  pet_supplies: require('../../assets/cat_pet_supplies.png'),
  musical_instruments: require('../../assets/cat_musical_instruments.png'),
};

const CATEGORIES_DATA = [
  {
    id: "popular",
    name: "Popular",
    iconName: "StarIcon",
    iconColor: "#E28743",
    iconBg: "#FFF9E6",
    sections: [
      {
        sectionTitle: "Featured On Meesho",
        items: [
          { name: "Top Brands", image: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=200&auto=format&fit=crop&q=60" },
          { name: "Premium Collection", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200&auto=format&fit=crop&q=60" },
          { name: "Fruits", image: "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=200&auto=format&fit=crop&q=60" },
          { name: "Cookware", image: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=200&auto=format&fit=crop&q=60" }
        ]
      },
      {
        sectionTitle: "All Popular",
        items: [
          { name: "Kurtis & Dress Materials", image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=200&auto=format&fit=crop&q=60" },
          { name: "Sarees", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200&auto=format&fit=crop&q=60" },
          { name: "Westernwear", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&auto=format&fit=crop&q=60" },
          { name: "Jewellery", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&auto=format&fit=crop&q=60" },
          { name: "Men Fashion", image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=60" },
          { name: "Kids", image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=200&auto=format&fit=crop&q=60" },
          { name: "Footwear", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=200&auto=format&fit=crop&q=60" },
          { name: "Beauty & Personal Care", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&auto=format&fit=crop&q=60" },
          { name: "Grocery", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=60" },
          { name: "Accessories", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200&auto=format&fit=crop&q=60" },
          { name: "Electronics", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=60" },
          { name: "Home Decor", image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&auto=format&fit=crop&q=60" }
        ]
      }
    ]
  },
  {
    id: "kurti_saree_lehenga",
    name: "Kurti, Saree & Lehenga",
    iconName: "Dress02Icon",
    iconColor: "#D81B60",
    iconBg: "#FCE4EC",
    sections: [
      {
        sectionTitle: "Kurtis",
        items: [
          { name: "All Kurtis", image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=200&auto=format&fit=crop&q=60" },
          { name: "Printed Kurtis", image: "https://images.unsplash.com/photo-1608748010899-18f300247112?w=200&auto=format&fit=crop&q=60" },
          { name: "Plain Kurtis", image: "https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?w=200&auto=format&fit=crop&q=60" },
          { name: "Kurti Sets", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200&auto=format&fit=crop&q=60" }
        ]
      },
      {
        sectionTitle: "Sarees",
        items: [
          { name: "All Sarees", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200&auto=format&fit=crop&q=60" },
          { name: "Silk Sarees", image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=200&auto=format&fit=crop&q=60" },
          { name: "Cotton Sarees", image: "https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?w=200&auto=format&fit=crop&q=60" },
          { name: "Party Wear", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200&auto=format&fit=crop&q=60" }
        ]
      },
      {
        sectionTitle: "Lehenga",
        items: [
          { name: "All Lehenga", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200&auto=format&fit=crop&q=60" },
          { name: "Bridal", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200&auto=format&fit=crop&q=60" },
          { name: "Designer", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200&auto=format&fit=crop&q=60" }
        ]
      }
    ]
  },
  {
    id: "women_western",
    name: "Women Western",
    iconName: "TShirtIcon",
    iconColor: "#2E7D32",
    iconBg: "#E8F5E9",
    sections: [
      {
        sectionTitle: "Topwear",
        items: [
          { name: "All Topwear", image: "https://plus.unsplash.com/premium_photo-1675130119373-61ada6685d63?w=200&auto=format&fit=crop&q=60" },
          { name: "Tops & Tunics", image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=200&auto=format&fit=crop&q=60" },
          { name: "Dresses", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200&auto=format&fit=crop&q=60" },
          { name: "T-shirts", image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=200&auto=format&fit=crop&q=60" },
          { name: "Gowns", image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=200&auto=format&fit=crop&q=60" },
          { name: "Tops & Bottom Sets", image: "https://images.unsplash.com/photo-1609505848912-b7c3b8b4beda?w=200&auto=format&fit=crop&q=60" },
          { name: "Shirts", image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=200&auto=format&fit=crop&q=60" },
          { name: "Jumpsuits", image: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=200&auto=format&fit=crop&q=60" },
          { name: "New Trends", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&auto=format&fit=crop&q=60" }
        ]
      },
      {
        sectionTitle: "Bottomwear",
        items: [
          { name: "All Bottomwear", image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=200&auto=format&fit=crop&q=60" },
          { name: "Jeans & Jeggings", image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=200&auto=format&fit=crop&q=60" },
          { name: "Palazzos", image: "https://images.unsplash.com/photo-1604176354204-9266737828e4?w=200&auto=format&fit=crop&q=60" },
          { name: "Trousers & Pants", image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=200&auto=format&fit=crop&q=60" },
          { name: "Leggings", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=60" },
          { name: "Shorts & Skirts", image: "https://images.unsplash.com/photo-1583496661160-fb488653f582?w=200&auto=format&fit=crop&q=60" }
        ]
      },
      {
        sectionTitle: "Winterwear",
        items: [
          { name: "Jackets", image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=200&auto=format&fit=crop&q=60" },
          { name: "Sweaters", image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=200&auto=format&fit=crop&q=60" },
          { name: "Cardigans", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&auto=format&fit=crop&q=60" }
        ]
      }
    ]
  },
  {
    id: "lingerie",
    name: "Lingerie",
    iconName: "FavouriteIcon",
    iconColor: "#C2185B",
    iconBg: "#FCE4EC",
    sections: [
      {
        sectionTitle: "Innerwear",
        items: [
          { name: "Bra & Bralettes", image: "https://images.unsplash.com/photo-1590502593747-42a996133562?w=200&auto=format&fit=crop&q=60" },
          { name: "Panties", image: "https://images.unsplash.com/photo-1616150638538-ffb0679a3fc4?w=200&auto=format&fit=crop&q=60" },
          { name: "Lingerie Sets", image: "https://images.unsplash.com/photo-1608748010899-18f300247112?w=200&auto=format&fit=crop&q=60" },
          { name: "Shapewear", image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&auto=format&fit=crop&q=60" },
          { name: "Camisoles & Inners", image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=200&auto=format&fit=crop&q=60" },
          { name: "Straps Tapes & Pasties", image: "https://images.unsplash.com/photo-1574169208507-84376144848b?w=200&auto=format&fit=crop&q=60" }
        ]
      },
      {
        sectionTitle: "Sleepwear",
        items: [
          { name: "Women Nightsuits", image: "https://images.unsplash.com/photo-1562572159-4ebcd318f4dd?w=200&auto=format&fit=crop&q=60" },
          { name: "Women Nightdress", image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200&auto=format&fit=crop&q=60" },
          { name: "Other Sleepwear", image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=200&auto=format&fit=crop&q=60" }
        ]
      },
      {
        sectionTitle: "Sports Wear",
        items: [
          { name: "Sports Bottomwear", image: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=200&auto=format&fit=crop&q=60" },
          { name: "Sports Bra", image: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=200&auto=format&fit=crop&q=60" },
          { name: "Top & Bottom Sets", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=60" }
        ]
      },
      {
        sectionTitle: "Maternity Wear",
        items: [
          { name: "Kurti & Topwear", image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=200&auto=format&fit=crop&q=60" },
          { name: "Feeding Bras", image: "https://images.unsplash.com/photo-1590502593747-42a996133562?w=200&auto=format&fit=crop&q=60" },
          { name: "Briefs", image: "https://images.unsplash.com/photo-1616150638538-ffb0679a3fc4?w=200&auto=format&fit=crop&q=60" }
        ]
      }
    ]
  },
  {
    id: "men",
    name: "Men",
    iconName: "UserIcon",
    iconColor: "#1565C0",
    iconBg: "#E3F2FD",
    sections: [
      {
        sectionTitle: "Top Wear",
        items: [
          { name: "Summer T-Shirts", image: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=200&auto=format&fit=crop&q=60" },
          { name: "Shirts", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200&auto=format&fit=crop&q=60" },
          { name: "T-Shirts Combos", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=200&auto=format&fit=crop&q=60" }
        ]
      },
      {
        sectionTitle: "Bottom Wear",
        items: [
          { name: "Jeans", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=200&auto=format&fit=crop&q=60" },
          { name: "Cargos/Trousers", image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=200&auto=format&fit=crop&q=60" },
          { name: "Dhotis/Lungis", image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=200&auto=format&fit=crop&q=60" }
        ]
      },
      {
        sectionTitle: "Ethnic Wear",
        items: [
          { name: "Kurtas", image: "https://images.unsplash.com/photo-1608748010899-18f300247112?w=200&auto=format&fit=crop&q=60" },
          { name: "Kurta Sets", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200&auto=format&fit=crop&q=60" },
          { name: "Nehru Jacket", image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=200&auto=format&fit=crop&q=60" }
        ]
      },
      {
        sectionTitle: "Innerwear",
        items: [
          { name: "Vests", image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=200&auto=format&fit=crop&q=60" },
          { name: "Briefs", image: "https://images.unsplash.com/photo-1616150638538-ffb0679a3fc4?w=200&auto=format&fit=crop&q=60" },
          { name: "Boxers", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200&auto=format&fit=crop&q=60" }
        ]
      },
      {
        sectionTitle: "Sports Wear",
        items: [
          { name: "Sports Tees", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=200&auto=format&fit=crop&q=60" },
          { name: "Track Pants", image: "https://images.unsplash.com/photo-1517438322307-e67111335449?w=200&auto=format&fit=crop&q=60" },
          { name: "Running Shorts", image: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=200&auto=format&fit=crop&q=60" }
        ]
      }
    ]
  },
  {
    id: "kids_toys",
    name: "Kids & Toys",
    iconName: "BabyBed01Icon",
    iconColor: "#00838F",
    iconBg: "#E0F7FA",
    sections: [
      {
        sectionTitle: "Kids Clothing",
        items: [
          { name: "Girls", image: "https://images.unsplash.com/photo-1519689680058-324335c77ebe?w=200&auto=format&fit=crop&q=60" },
          { name: "Boys", image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=200&auto=format&fit=crop&q=60" },
          { name: "Babies", image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200&auto=format&fit=crop&q=60" },
          { name: "Clothing Sets", image: "https://images.unsplash.com/photo-1519689680058-324335c77ebe?w=200&auto=format&fit=crop&q=60" },
          { name: "Frocks & Dresses", image: "https://images.unsplash.com/photo-1608748010899-18f300247112?w=200&auto=format&fit=crop&q=60" },
          { name: "T-Shirt & Polos", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=200&auto=format&fit=crop&q=60" }
        ]
      },
      {
        sectionTitle: "Kids Toys",
        items: [
          { name: "Toys & Games", image: "https://images.unsplash.com/photo-1559251606-c623743a6d76?w=200&auto=format&fit=crop&q=60" },
          { name: "Perfect Gifting", image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=200&auto=format&fit=crop&q=60" },
          { name: "Best Sellers", image: "https://images.unsplash.com/photo-1559251606-c623743a6d76?w=200&auto=format&fit=crop&q=60" },
          { name: "Baby Gears", image: "https://images.unsplash.com/photo-1519689680058-324335c77ebe?w=200&auto=format&fit=crop&q=60" }
        ]
      },
      {
        sectionTitle: "Kids Accessories",
        items: [
          { name: "Bags & Backpacks", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&auto=format&fit=crop&q=60" },
          { name: "Kids Accessories", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&auto=format&fit=crop&q=60" },
          { name: "Party Items", image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&auto=format&fit=crop&q=60" }
        ]
      },
      {
        sectionTitle: "Baby Care",
        items: [
          { name: "Baby Wipes", image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200&auto=format&fit=crop&q=60" },
          { name: "Baby Lotions", image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=200&auto=format&fit=crop&q=60" },
          { name: "Baby Powder", image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200&auto=format&fit=crop&q=60" }
        ]
      }
    ]
  },
  {
    id: "home_kitchen",
    name: "Home & Kitchen",
    iconName: "Sofa01Icon",
    iconColor: "#EF6C00",
    iconBg: "#FFF3E0",
    sections: [
      {
        sectionTitle: "Home Decor",
        items: [
          { name: "View All", image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&auto=format&fit=crop&q=60" },
          { name: "Covers", image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=200&auto=format&fit=crop&q=60" },
          { name: "Key Holders", image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=200&auto=format&fit=crop&q=60" },
          { name: "Artificial Plants", image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=200&auto=format&fit=crop&q=60" },
          { name: "Pooja Needs", image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&auto=format&fit=crop&q=60" },
          { name: "Party Supplies", image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&auto=format&fit=crop&q=60" },
          { name: "Wallpapers & Stickers", image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&auto=format&fit=crop&q=60" },
          { name: "Showpieces & Idols", image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=200&auto=format&fit=crop&q=60" },
          { name: "Clocks & Wall Decor", image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&auto=format&fit=crop&q=60" }
        ]
      },
      {
        sectionTitle: "Kitchen & Appliances",
        items: [
          { name: "View All", image: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=200&auto=format&fit=crop&q=60" },
          { name: "Storage & Organizers", image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=200&auto=format&fit=crop&q=60" },
          { name: "Cookware", image: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=200&auto=format&fit=crop&q=60" },
          { name: "Kitchen Tools", image: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=200&auto=format&fit=crop&q=60" },
          { name: "Kitchen Appliances", image: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=200&auto=format&fit=crop&q=60" },
          { name: "Dinnerware", image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=200&auto=format&fit=crop&q=60" }
        ]
      }
    ]
  },
  {
    id: "beauty_health",
    name: "Beauty & Health",
    iconName: "PaintBrush02Icon",
    iconColor: "#AD1457",
    iconBg: "#FCE4EC",
    sections: [
      {
        sectionTitle: "Makeup",
        items: [
          { name: "Lipstick", image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=200&auto=format&fit=crop&q=60" },
          { name: "Eye Shadow & Liner", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&auto=format&fit=crop&q=60" },
          { name: "Face Makeup", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&auto=format&fit=crop&q=60" },
          { name: "Makeup Kits", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&auto=format&fit=crop&q=60" },
          { name: "Hair Curlers", image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=60" },
          { name: "Nail Makeup", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&auto=format&fit=crop&q=60" },
          { name: "Brushes & Acc", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&auto=format&fit=crop&q=60" },
          { name: "Hair Removal", image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=60" },
          { name: "Perfumes & More", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&auto=format&fit=crop&q=60" }
        ]
      },
      {
        sectionTitle: "Personal Care",
        items: [
          { name: "View All", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&auto=format&fit=crop&q=60" },
          { name: "Body Lotion", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&auto=format&fit=crop&q=60" },
          { name: "Hair Oil & Shampoo", image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=60" },
          { name: "Whitening Creams", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&auto=format&fit=crop&q=60" },
          { name: "Straighteners & Dryers", image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=60" },
          { name: "Face Oil & Serum", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&auto=format&fit=crop&q=60" }
        ]
      }
    ]
  },
  {
    id: "jewellery_accessories",
    name: "Jewellery & Accessories",
    iconName: "Diamond01Icon",
    iconColor: "#00796B",
    iconBg: "#E0F2F1",
    sections: [
      {
        sectionTitle: "Jewellery",
        items: [
          { name: "All Jewellery", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&auto=format&fit=crop&q=60" },
          { name: "Jewellery Sets", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&auto=format&fit=crop&q=60" },
          { name: "Earrings", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&auto=format&fit=crop&q=60" },
          { name: "Mangalsutras", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&auto=format&fit=crop&q=60" },
          { name: "Necklaces & Chains", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&auto=format&fit=crop&q=60" },
          { name: "Bangles & Bracelets", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&auto=format&fit=crop&q=60" },
          { name: "Anklets & Nosepins", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&auto=format&fit=crop&q=60" },
          { name: "Kamarbandh & Maangtika", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&auto=format&fit=crop&q=60" }
        ]
      },
      {
        sectionTitle: "Men Accessories",
        items: [
          { name: "All Accessories", image: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=200&auto=format&fit=crop&q=60" },
          { name: "Men Watches", image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=200&auto=format&fit=crop&q=60" },
          { name: "Wallets", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200&auto=format&fit=crop&q=60" },
          { name: "Men Jewellery", image: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=200&auto=format&fit=crop&q=60" },
          { name: "Sunglasses & Spectacles", image: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=200&auto=format&fit=crop&q=60" },
          { name: "Belts", image: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=200&auto=format&fit=crop&q=60" }
        ]
      },
      {
        sectionTitle: "Women Accessories",
        items: [
          { name: "Hair Accessories", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200&auto=format&fit=crop&q=60" },
          { name: "Handbags", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200&auto=format&fit=crop&q=60" },
          { name: "Clutches", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200&auto=format&fit=crop&q=60" }
        ]
      }
    ]
  },
  {
    id: "bags_footwear",
    name: "Bags & Footwear",
    iconName: "ShoppingCart01Icon",
    iconColor: "#6D4C41",
    iconBg: "#EFEBE9",
    sections: [
      {
        sectionTitle: "Women Footwear",
        items: [
          { name: "View All", image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=200&auto=format&fit=crop&q=60" },
          { name: "Heels & Sandals", image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=200&auto=format&fit=crop&q=60" },
          { name: "Flats", image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=200&auto=format&fit=crop&q=60" },
          { name: "Boots", image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=200&auto=format&fit=crop&q=60" },
          { name: "Flipflops & Slippers", image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=200&auto=format&fit=crop&q=60" },
          { name: "Bellies & Ballerinas", image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=200&auto=format&fit=crop&q=60" }
        ]
      },
      {
        sectionTitle: "Men Footwear",
        items: [
          { name: "View All", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=200&auto=format&fit=crop&q=60" },
          { name: "Men Casual Shoes", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=200&auto=format&fit=crop&q=60" },
          { name: "Men Sports Shoes", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&auto=format&fit=crop&q=60" },
          { name: "Men Flip Flops", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=200&auto=format&fit=crop&q=60" },
          { name: "Men Formal Shoes", image: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=200&auto=format&fit=crop&q=60" },
          { name: "Loafers", image: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=200&auto=format&fit=crop&q=60" }
        ]
      },
      {
        sectionTitle: "Kids Footwear",
        items: [
          { name: "View All", image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=200&auto=format&fit=crop&q=60" },
          { name: "Boys Shoes", image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=200&auto=format&fit=crop&q=60" },
          { name: "Girls Shoes", image: "https://images.unsplash.com/photo-1519689680058-324335c77ebe?w=200&auto=format&fit=crop&q=60" }
        ]
      }
    ]
  },
  {
    id: "electronics",
    name: "Electronics",
    iconName: "Camera02Icon",
    iconColor: "#37474F",
    iconBg: "#ECEFF1",
    sections: [
      {
        sectionTitle: "Audio & Mobiles",
        items: [
          { name: "Neckband", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=60" },
          { name: "Speakers", image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=200&auto=format&fit=crop&q=60" },
          { name: "Bluetooth Earbuds", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200&auto=format&fit=crop&q=60" },
          { name: "Wired Earphone", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=60" }
        ]
      },
      {
        sectionTitle: "Accessories",
        items: [
          { name: "Mobile Holders", image: "https://images.unsplash.com/photo-1584438784894-089d6a128f3e?w=200&auto=format&fit=crop&q=60" },
          { name: "Mobile Chargers", image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=200&auto=format&fit=crop&q=60" },
          { name: "Power Banks", image: "https://images.unsplash.com/photo-1609592424089-a864d42b9101?w=200&auto=format&fit=crop&q=60" },
          { name: "Microphone", image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=200&auto=format&fit=crop&q=60" },
          { name: "Selfie Ringlight", image: "https://images.unsplash.com/photo-1609592424089-a864d42b9101?w=200&auto=format&fit=crop&q=60" },
          { name: "Tripod & Monopod", image: "https://images.unsplash.com/photo-1609592424089-a864d42b9101?w=200&auto=format&fit=crop&q=60" },
          { name: "Extension Cord", image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=200&auto=format&fit=crop&q=60" },
          { name: "Screen Expanders", image: "https://images.unsplash.com/photo-1584438784894-089d6a128f3e?w=200&auto=format&fit=crop&q=60" },
          { name: "View All", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=60" }
        ]
      }
    ]
  },
  {
    id: "watches",
    name: "Watches",
    iconName: "SmartWatch01Icon",
    iconColor: "#F57C00",
    iconBg: "#FFF3E0",
    sections: [
      {
        sectionTitle: "watches",
        items: [
          { name: "Analog Watches", image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=200&auto=format&fit=crop&q=60" },
          { name: "Digital Watches", image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=200&auto=format&fit=crop&q=60" },
          { name: "Sport Watches", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200&auto=format&fit=crop&q=60" },
          { name: "Couple Watch", image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=200&auto=format&fit=crop&q=60" },
          { name: "Bands & Boxes", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200&auto=format&fit=crop&q=60" },
          { name: "View All", image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=200&auto=format&fit=crop&q=60" }
        ]
      }
    ]
  },
  {
    id: "sports_fitness",
    name: "Sports & Fitness",
    iconName: "Dumbbell02Icon",
    iconColor: "#2E7D32",
    iconBg: "#E8F5E9",
    sections: [
      {
        sectionTitle: "Fitness",
        items: [
          { name: "View All", image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&auto=format&fit=crop&q=60" },
          { name: "Sweat Belts", image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&auto=format&fit=crop&q=60" },
          { name: "Exercise Bands", image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&auto=format&fit=crop&q=60" },
          { name: "Tummy Trimmers", image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&auto=format&fit=crop&q=60" },
          { name: "Skipping Ropes", image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&auto=format&fit=crop&q=60" },
          { name: "Hand Gripper", image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&auto=format&fit=crop&q=60" },
          { name: "Yoga", image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=200&auto=format&fit=crop&q=60" },
          { name: "Fitness Acc.", image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&auto=format&fit=crop&q=60" },
          { name: "Fitness Gears", image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&auto=format&fit=crop&q=60" }
        ]
      },
      {
        sectionTitle: "Sports",
        items: [
          { name: "Cricket", image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=200&auto=format&fit=crop&q=60" },
          { name: "Cycles & Acc.", image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=200&auto=format&fit=crop&q=60" },
          { name: "Skating", image: "https://images.unsplash.com/photo-1564982743477-472d88b4c447?w=200&auto=format&fit=crop&q=60" },
          { name: "Football", image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=200&auto=format&fit=crop&q=60" },
          { name: "Badminton", image: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=200&auto=format&fit=crop&q=60" },
          { name: "Volleyball", image: "https://images.unsplash.com/photo-1592656094267-764a45068526?w=200&auto=format&fit=crop&q=60" }
        ]
      }
    ]
  },
  {
    id: "car_motorbike",
    name: "Car & Motorbike",
    iconName: "Car01Icon",
    iconColor: "#1565C0",
    iconBg: "#E3F2FD",
    sections: [
      {
        sectionTitle: "Bike & Scooty Accessories",
        items: [
          { name: "Bike LED Lights", image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=200&auto=format&fit=crop&q=60" },
          { name: "Bike Covers", image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=200&auto=format&fit=crop&q=60" },
          { name: "Bike Accessories", image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=200&auto=format&fit=crop&q=60" },
          { name: "Safety Gear", image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=200&auto=format&fit=crop&q=60" },
          { name: "Helmets", image: "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=200&auto=format&fit=crop&q=60" },
          { name: "Scooty Acc.", image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=200&auto=format&fit=crop&q=60" }
        ]
      },
      {
        sectionTitle: "Car Accessories",
        items: [
          { name: "Interior Acc.", image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&auto=format&fit=crop&q=60" },
          { name: "Car Cleaning", image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&auto=format&fit=crop&q=60" },
          { name: "Car Repair", image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=200&auto=format&fit=crop&q=60" },
          { name: "Phone Holders", image: "https://images.unsplash.com/photo-1584438784894-089d6a128f3e?w=200&auto=format&fit=crop&q=60" },
          { name: "Car Covers", image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&auto=format&fit=crop&q=60" },
          { name: "Exterior Acc", image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&auto=format&fit=crop&q=60" }
        ]
      }
    ]
  },
  {
    id: "office_supplies",
    name: "Office Supplies &...",
    iconName: "Store02Icon",
    iconColor: "#6A1B9A",
    iconBg: "#F3E5F5",
    sections: [
      {
        sectionTitle: "Office Supplies & Stationery",
        items: [
          { name: "View All", image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=200&auto=format&fit=crop&q=60" },
          { name: "Pens & Pencils", image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=200&auto=format&fit=crop&q=60" },
          { name: "Diaries & Books", image: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=200&auto=format&fit=crop&q=60" },
          { name: "Art & Craft", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&auto=format&fit=crop&q=60" },
          { name: "Files & Desk Org", image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=200&auto=format&fit=crop&q=60" },
          { name: "Adhesives & Tapes", image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=200&auto=format&fit=crop&q=60" }
        ]
      }
    ]
  },
  {
    id: "grocery",
    name: "Grocery",
    iconName: "ShoppingBasket01Icon",
    iconColor: "#2E7D32",
    iconBg: "#E8F5E9",
    sections: [
      {
        sectionTitle: "Food & Drinks",
        items: [
          { name: "Dry Fruits", image: "https://images.unsplash.com/photo-1596003906949-67221c379fea?w=200&auto=format&fit=crop&q=60" },
          { name: "Masala & Spices", image: "https://images.unsplash.com/photo-1596003906949-67221c379fea?w=200&auto=format&fit=crop&q=60" },
          { name: "Snacks", image: "https://images.unsplash.com/photo-1599490659213-e2b9527b0f76?w=200&auto=format&fit=crop&q=60" },
          { name: "Pickles", image: "https://images.unsplash.com/photo-1596003906949-67221c379fea?w=200&auto=format&fit=crop&q=60" },
          { name: "Chocolates", image: "https://images.unsplash.com/photo-1549007994-cb92ca818bc6?w=200&auto=format&fit=crop&q=60" },
          { name: "Biscuits", image: "https://images.unsplash.com/photo-1558961309-dbdf006b528a?w=200&auto=format&fit=crop&q=60" },
          { name: "Coffee", image: "https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=200&auto=format&fit=crop&q=60" },
          { name: "Tea", image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=200&auto=format&fit=crop&q=60" },
          { name: "View All", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=60" }
        ]
      }
    ]
  },
  {
    id: "books",
    name: "Books",
    iconName: "BookOpen01Icon",
    iconColor: "#EF6C00",
    iconBg: "#FFF3E0",
    sections: [
      {
        sectionTitle: "Fiction & Non Fiction",
        items: [
          { name: "Children's Books", image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=200&auto=format&fit=crop&q=60" },
          { name: "Motivation", image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&auto=format&fit=crop&q=60" },
          { name: "Novels", image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&auto=format&fit=crop&q=60" },
          { name: "Religious", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&auto=format&fit=crop&q=60" },
          { name: "Economics", image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&auto=format&fit=crop&q=60" },
          { name: "View All Books", image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&auto=format&fit=crop&q=60" }
        ]
      },
      {
        sectionTitle: "Academic Books",
        items: [
          { name: "UPSC Exams", image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&auto=format&fit=crop&q=60" },
          { name: "Competitive Prep", image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&auto=format&fit=crop&q=60" },
          { name: "Reference Books", image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&auto=format&fit=crop&q=60" },
          { name: "School Textbooks", image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=200&auto=format&fit=crop&q=60" },
          { name: "University Books", image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&auto=format&fit=crop&q=60" },
          { name: "All Academic Books", image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&auto=format&fit=crop&q=60" }
        ]
      }
    ]
  },
  {
    id: "pet_supplies",
    name: "Pet Supplies",
    iconName: "CatIcon",
    iconColor: "#C2185B",
    iconBg: "#FCE4EC",
    sections: [
      {
        sectionTitle: "Pet Supplies",
        items: [
          { name: "Collars & Leashes", image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200&auto=format&fit=crop&q=60" },
          { name: "Clothes & Care", image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=200&auto=format&fit=crop&q=60" },
          { name: "Food & Treats", image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=200&auto=format&fit=crop&q=60" },
          { name: "Aquarium Acc.", image: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=200&auto=format&fit=crop&q=60" },
          { name: "Pet Toys", image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200&auto=format&fit=crop&q=60" },
          { name: "Pet Bowls", image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200&auto=format&fit=crop&q=60" }
        ]
      }
    ]
  },
  {
    id: "musical_instruments",
    name: "Musical Instruments",
    iconName: "MusicNote01Icon",
    iconColor: "#5D4037",
    iconBg: "#EFEBE9",
    sections: [
      {
        sectionTitle: "Musical Instruments",
        items: [
          { name: "Dholaks & Drums", image: "https://images.unsplash.com/photo-1524230572899-a7bd269852f9?w=200&auto=format&fit=crop&q=60" },
          { name: "Piano & Keyboard", image: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=200&auto=format&fit=crop&q=60" },
          { name: "String Inst.", image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=200&auto=format&fit=crop&q=60" },
          { name: "Wind Inst.", image: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=200&auto=format&fit=crop&q=60" },
          { name: "Accessories", image: "https://images.unsplash.com/photo-1524230572899-a7bd269852f9?w=200&auto=format&fit=crop&q=60" },
          { name: "All Inst.", image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=200&auto=format&fit=crop&q=60" }
        ]
      }
    ]
  }
];

export default function CategoriesScreen() {
  const navigation = useNavigation<any>();
  const [activeCategoryId, setActiveCategoryId] = useState(CATEGORIES_DATA[0].id);
  const totalItems = useSelector((state: RootState) => state.cart.count);

  const leftScrollRef = useRef<ScrollView>(null);
  const rightScrollRef = useRef<ScrollView>(null);
  const isManualScrolling = useRef(false);
  const offsetsRef = useRef<Record<string, number>>({});
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSidebarPress = (catId: string, index: number) => {
    setActiveCategoryId(catId);
    isManualScrolling.current = true;

    const targetY = offsetsRef.current[catId];
    if (typeof targetY === 'number') {
      rightScrollRef.current?.scrollTo({ y: targetY - 10, animated: true });
    }

    leftScrollRef.current?.scrollTo({
      y: index * 85 - 250,
      animated: true
    });

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      isManualScrolling.current = false;
    }, 1000);
  };

  const onRightScroll = (event: any) => {
    if (isManualScrolling.current) return;
    const y = event.nativeEvent.contentOffset.y;
    const { layoutMeasurement, contentSize } = event.nativeEvent;

    // Detect if scroll position is very close to bottom to activate last category
    const isCloseToBottom = layoutMeasurement.height + y >= contentSize.height - 80;

    let currentCatId = activeCategoryId;

    if (isCloseToBottom) {
      currentCatId = CATEGORIES_DATA[CATEGORIES_DATA.length - 1].id;
    } else {
      let maxMatchedOffset = -1;
      for (let i = 0; i < CATEGORIES_DATA.length; i++) {
        const cat = CATEGORIES_DATA[i];
        const catOffset = offsetsRef.current[cat.id];
        // 100px threshold allows smoother transition before headers fully reach the top border
        if (catOffset !== undefined && y >= catOffset - 100) {
          if (catOffset > maxMatchedOffset) {
            maxMatchedOffset = catOffset;
            currentCatId = cat.id;
          }
        }
      }
    }

    if (currentCatId !== activeCategoryId) {
      setActiveCategoryId(currentCatId);

      const catIndex = CATEGORIES_DATA.findIndex(c => c.id === currentCatId);
      if (catIndex !== -1) {
        leftScrollRef.current?.scrollTo({
          y: catIndex * 85 - 250,
          animated: true
        });
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, width: '100%', alignItems: 'stretch' }}>
      {/* ─── HEADER ─── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEEEEE', backgroundColor: '#FFFFFF', width: '100%', height: 48 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#111111', letterSpacing: 0.5 }}>CATEGORIES</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={{ padding: 4 }} onPress={() => navigation.navigate('Search')}>
            <HugeIcon icon={Hugeicons.Search02Icon} size={20} color="#111111" />
          </TouchableOpacity>
          <TouchableOpacity style={{ padding: 4, marginLeft: 12 }} onPress={() => navigation.navigate('Wishlist')}>
            <HugeIcon icon={Hugeicons.FavouriteIcon} size={20} color="#111111" />
          </TouchableOpacity>
          <TouchableOpacity style={{ padding: 4, marginLeft: 12, position: 'relative' }} onPress={() => navigation.navigate('Cart')}>
            <HugeIcon icon={Hugeicons.ShoppingCart01Icon} size={20} color="#111111" />
            {totalItems > 0 ? (
              <View style={{ position: 'absolute', top: -2, right: -2, backgroundColor: '#8B2FC9', borderRadius: 7, width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontSize: 8, fontWeight: '800' }}>{totalItems > 99 ? '99+' : totalItems}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── MAIN TWO-PANEL LAYOUT ─── */}
      <View style={{ flex: 1, flexDirection: 'row', width: '100%', alignItems: 'stretch', justifyContent: 'flex-start', overflow: 'hidden' }}>
        {/* LEFT SIDEBAR (fixed 90 width, scrolls independently) */}
        <ScrollView 
          ref={leftScrollRef}
          style={{ width: 90, minWidth: 90, maxWidth: 90, backgroundColor: '#F0F0F0', flexGrow: 0 }} 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {CATEGORIES_DATA.map((cat, catIdx) => {
            const isActive = cat.id === activeCategoryId;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => handleSidebarPress(cat.id, catIdx)}
                style={{
                  width: '100%',
                  paddingVertical: 10,
                  paddingHorizontal: 4,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isActive ? '#FFFFFF' : '#F0F0F0',
                  borderLeftWidth: 3,
                  borderLeftColor: isActive ? '#8B2FC9' : 'transparent',
                  borderBottomWidth: 1,
                  borderBottomColor: '#E8E8E8'
                }}
              >
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: cat.iconBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 4,
                  borderWidth: 2,
                  borderColor: isActive ? 'rgba(139, 47, 201, 0.3)' : 'transparent',
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1
                }}>
                  <Image 
                    source={CATEGORY_ICONS_MAPPING[cat.id]} 
                    style={{ width: 28, height: 28 }} 
                    resizeMode="contain" 
                  />
                </View>
                <Text
                  style={{
                    fontSize: 10,
                    textAlign: 'center',
                    lineHeight: 12,
                    color: isActive ? '#8B2FC9' : '#444444',
                    fontWeight: isActive ? '600' : '400',
                    width: '100%'
                  }}
                  numberOfLines={2}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* RIGHT CONTENT PANEL (flex: 1, scrolls independently) */}
        <ScrollView 
          ref={rightScrollRef}
          style={{ flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 10 }} 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ paddingBottom: 100 }}
          onScroll={onRightScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={() => {
            isManualScrolling.current = false;
          }}
        >
          {CATEGORIES_DATA.map((cat, catIdx) => (
            <View 
              key={cat.id}
              onLayout={(e) => {
                const { y } = e.nativeEvent.layout;
                if (y > 0 || catIdx === 0) {
                  offsetsRef.current[cat.id] = y;
                }
              }}
              style={{ paddingBottom: 20 }}
            >
              {/* Category Breadcrumb */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: catIdx === 0 ? 15 : 30, marginBottom: 4 }}>
                <Text style={{ fontSize: 10, color: '#999999', textTransform: 'uppercase', letterSpacing: 1 }}>
                  🏠 {cat.name}
                </Text>
              </View>
              <View style={{ borderBottomWidth: 1, borderBottomColor: '#DDDDDD', marginBottom: 12 }} />

              {cat.sections.map((section, idx) => (
                <View key={idx}>
                  {/* Section Title */}
                  <Text style={{ fontSize: 16, color: '#111111', fontWeight: '700', marginTop: 12, marginBottom: 10, textTransform: 'capitalize' }}>
                    {section.sectionTitle}
                  </Text>
                  
                  {/* Grid Layout (3 columns) */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', width: '100%' }}>
                    {section.items.map((item, itemIdx) => (
                      <TouchableOpacity
                        key={itemIdx}
                        onPress={() => navigation.navigate('Search', { initialQuery: item.name })}
                        style={{ width: '33.33%', alignItems: 'center', marginBottom: 10 }}
                      >
                        <View style={{
                          width: 70,
                          height: 70,
                          borderRadius: 35,
                          backgroundColor: '#F0F0F0',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 4,
                          overflow: 'hidden'
                        }}>
                          <Image 
                            source={{ uri: item.image }} 
                            style={{ width: 70, height: 70, borderRadius: 35 }} 
                            resizeMode="cover" 
                          />
                        </View>
                        <Text 
                          style={{ fontSize: 10, color: '#333333', textAlign: 'center', marginTop: 4, lineHeight: 13, maxWidth: 70 }} 
                          numberOfLines={2}
                        >
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
