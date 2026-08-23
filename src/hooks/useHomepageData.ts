import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase';

export interface HomepageHeroBanner {
  id?: string;
  title?: string;
  subtitle?: string;
  tag?: string;
  badge?: string;
  badgeText?: string;
  imageUrl?: string;
  image?: string;
  videoUrl?: string;
  video?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'gif' | 'video';
  buttonText?: string;
  ctaText?: string;
  buttonLink?: string;
  link?: string;
  bgColor?: string;
  textColor?: string;
  overlayOpacity?: number;
  targetCategory?: string;
}

export interface ExploreCategoryItem {
  id: string;
  title?: string;
  name?: string;
  imageUrl?: string;
  img?: string;
  link?: string;
  tag?: string;
  discountText?: string;
}

export interface TabHomepageLayout {
  tabId?: string;
  heroBanner?: HomepageHeroBanner;
  heroBanners?: HomepageHeroBanner[];
  heroSlides?: any[];
  slides?: any[];
  categoryStories?: any[];
  stories?: any[];
  cardShapeSettings?: any;
  blocks?: any[];
  exploreCategories?: {
    sectionTitle?: string;
    sectionSubtitle?: string;
    items?: ExploreCategoryItem[];
  } | ExploreCategoryItem[];
  exploreTitle?: string;
  subCategories?: ExploreCategoryItem[];
  curatedTitle?: string;
  emptyStateTitle?: string;
  emptyStateSub?: string;
  emptyEmoji?: string;
}

/**
 * Custom hook to fetch dynamic homepage layout per tab from Firestore
 * Collection: `app_homepage_layout`
 * Document ID: `activeTab.toLowerCase()` (e.g. 'all', 'women', 'men', 'kids', 'beauty', 'groceries', 'electronics')
 * 
 * Features:
 * - Real-time live Firestore updates via `onSnapshot`
 * - Offline AsyncStorage caching for instant startup
 */
export function useHomepageData(activeTab: string) {
  const [data, setData] = useState<TabHomepageLayout | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!activeTab) {
      setData(null);
      setLoading(false);
      return;
    }

    const docId = activeTab.toLowerCase().trim();
    const cacheKey = `@app_homepage_layout_${docId}`;

    // 1. Load cached layout from AsyncStorage immediately for 0ms delay
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          setData(JSON.parse(cached));
          setLoading(false);
        }
      } catch (e) {
        // Cache read failed silently
      }
    };
    loadCache();

    // 2. Attach live Firestore listener
    const docRef = doc(db, 'app_homepage_layout', docId);

    const unsubscribe = onSnapshot(
      docRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const docData = docSnap.data() as TabHomepageLayout;
          const fullData: TabHomepageLayout = {
            tabId: docSnap.id,
            ...docData,
          };
          setData(fullData);
          try {
            await AsyncStorage.setItem(cacheKey, JSON.stringify(fullData));
          } catch (e) {
            // Cache write failed silently
          }
          setLoading(false);
        } else {
          // Try uppercase fallback if lower not found
          const upperDocRef = doc(db, 'app_homepage_layout', activeTab.toUpperCase().trim());
          const unsubUpper = onSnapshot(upperDocRef, (upperSnap) => {
            if (upperSnap.exists()) {
              const upperData = { tabId: upperSnap.id, ...upperSnap.data() } as TabHomepageLayout;
              setData(upperData);
            } else if (docId === 'all') {
              // Fallback to sdui_pages/homepage_main
              const sduiRef = doc(db, 'sdui_pages', 'homepage_main');
              onSnapshot(sduiRef, (sduiSnap) => {
                if (sduiSnap.exists()) {
                  setData({ tabId: 'homepage_main', ...sduiSnap.data() } as TabHomepageLayout);
                }
              });
            }
          });
          setLoading(false);
        }
      },
      (err) => {
        console.error(`🔴 Error listening to app_homepage_layout/${docId}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeTab]);

  return { data, loading, error };
}

export default useHomepageData;
