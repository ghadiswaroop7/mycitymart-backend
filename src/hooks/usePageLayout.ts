import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase';
import type { LayoutBlock, SDUIPageDocument } from '../types/sdui';

export interface UsePageLayoutResult {
  blocks: LayoutBlock[];
  loading: boolean;
  error: Error | null;
}

/**
 * Real-time Firestore listener for Server-Driven UI (SDUI) page layouts.
 * 
 * Collection: `sdui_pages`
 * Document ID format: `home`, `festive`, `deals`, `home_all`, `home_men`, etc.
 * 
 * Features:
 * - Real-time updates via Firestore `onSnapshot`
 * - Offline-first AsyncStorage caching
 * - Normalizes `blocks` and `layoutBlocks` schemas
 * - Supports fallback to `home` if tab-specific page document is not created yet
 */
export function usePageLayout(pageId: string): UsePageLayoutResult {
  const [blocks, setBlocks] = useState<LayoutBlock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!pageId) {
      setBlocks([]);
      setLoading(false);
      return;
    }

    const cleanPageId = pageId.trim();
    const cacheKey = `@sdui_page_${cleanPageId}`;

    // 1. Load cached blocks from AsyncStorage immediately for 0ms initial load
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBlocks(parsed);
            setLoading(false);
          }
        }
      } catch (e) {
        // Cache read error ignored
      }
    };
    loadCache();

    // 2. Attach live Firestore listener
    const docRef = doc(db, 'sdui_pages', cleanPageId);
    let fallbackUnsubscribe: (() => void) | null = null;

    const unsubscribe = onSnapshot(
      docRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as SDUIPageDocument;
          const rawBlocks = data.blocks || data.layoutBlocks || [];

          // Filter enabled & active blocks and sort by order
          const processedBlocks = rawBlocks
            .filter((block) => block.isActive !== false && block.enabled !== false)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

          setBlocks(processedBlocks);

          try {
            await AsyncStorage.setItem(cacheKey, JSON.stringify(processedBlocks));
          } catch (e) {
            // Cache write error ignored
          }
          setLoading(false);
        } else if (cleanPageId !== 'home') {
          // If specific document doesn't exist, check default 'home'
          const homeRef = doc(db, 'sdui_pages', 'home');
          fallbackUnsubscribe = onSnapshot(homeRef, async (homeSnap) => {
            if (homeSnap.exists()) {
              const homeData = homeSnap.data() as SDUIPageDocument;
              const rawBlocks = homeData.blocks || homeData.layoutBlocks || [];
              const processedBlocks = rawBlocks
                .filter((block) => block.isActive !== false && block.enabled !== false)
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
              setBlocks(processedBlocks);
            } else {
              setBlocks([]);
            }
            setLoading(false);
          });
        } else {
          setBlocks([]);
          setLoading(false);
        }
      },
      (err) => {
        console.error(`🔴 [SDUI] Error listening to sdui_pages/${cleanPageId}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      if (fallbackUnsubscribe) fallbackUnsubscribe();
    };
  }, [pageId]);

  return { blocks, loading, error };
}

export const useSDUIPage = usePageLayout;

export default usePageLayout;
