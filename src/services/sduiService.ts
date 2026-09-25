import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase';
import {
  ServerDrivenScreenLayout,
  LayoutBlock,
  UserTargetingContext,
  evaluateTargeting,
  isWidgetTypeSupported,
  CURRENT_SCHEMA_VERSION,
} from '../contracts/sduiContracts';
import { DEFAULT_HOME_LAYOUT } from '../contracts/defaultHomeLayout';

const CACHE_PREFIX = '@sdui_layout_cache_v2_';

/**
 * Normalizes raw Firestore document data into a valid ServerDrivenScreenLayout.
 */
function normalizeLayoutDocument(
  screenId: string,
  raw: any,
  context?: UserTargetingContext
): ServerDrivenScreenLayout {
  if (!raw) {
    return DEFAULT_HOME_LAYOUT;
  }

  // Extract raw block list (supports both blocks and layoutBlocks keys)
  const rawBlocks: any[] = Array.isArray(raw.blocks)
    ? raw.blocks
    : Array.isArray(raw.layoutBlocks)
    ? raw.layoutBlocks
    : [];

  // Filter blocks:
  // 1. Must be active / enabled
  // 2. Must pass targeting rules (city, userSegment, appVersion)
  // 3. Graceful degradation: log unsupported widget types in dev, but skip them safely without crashing
  const filteredBlocks: LayoutBlock[] = rawBlocks
    .filter((b) => {
      if (!b || typeof b !== 'object') return false;
      if (b.isActive === false || b.enabled === false) return false;

      // Targeting evaluation
      if (!evaluateTargeting(b.targeting, context)) {
        return false;
      }

      // Check if widget type is supported by this client build
      if (!isWidgetTypeSupported(b.type)) {
        if (__DEV__) {
          console.warn(`[SDUIService] Skipping unsupported widget type "${b.type}" on screen "${screenId}" (appVersion: ${context?.appVersion || '1.0.0'})`);
        }
        return false;
      }

      return true;
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((b) => ({
      id: b.id || `blk_${Math.random().toString(36).substr(2, 6)}`,
      type: b.type,
      title: b.title || '',
      subtitle: b.subtitle || '',
      style: b.style || {},
      data: b.data || {},
      targeting: b.targeting,
      isActive: true,
      order: b.order ?? 0,
    }));

  return {
    schemaVersion: raw.schemaVersion || CURRENT_SCHEMA_VERSION,
    screenId: raw.screenId || screenId,
    title: raw.title || raw.pageTitle || 'BazarPeth',
    version: raw.version || 1,
    publishedAt: raw.publishedAt || new Date().toISOString(),
    cardShapeSettings: raw.cardShapeSettings,
    blocks: filteredBlocks,
    metadata: raw.metadata,
  };
}

/**
 * Retrieves the locally cached layout for a screen from AsyncStorage.
 */
export async function getCachedLayout(screenId: string): Promise<ServerDrivenScreenLayout | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${screenId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn(`[SDUIService] Failed to read cache for "${screenId}":`, err);
  }
  return null;
}

/**
 * Writes a valid layout to local AsyncStorage cache.
 */
export async function cacheLayout(screenId: string, layout: ServerDrivenScreenLayout): Promise<void> {
  try {
    await AsyncStorage.setItem(`${CACHE_PREFIX}${screenId}`, JSON.stringify(layout));
  } catch (err) {
    console.warn(`[SDUIService] Failed to write cache for "${screenId}":`, err);
  }
}

/**
 * One-time fetch of a screen layout with targeting evaluation and offline fallback.
 */
export async function fetchScreenLayout(
  screenId: string,
  context?: UserTargetingContext
): Promise<ServerDrivenScreenLayout> {
  const cleanId = (screenId || 'home').toLowerCase().trim();

  try {
    // 1. Check primary published collection: `published_pages/{cleanId}`
    const pubDocRef = doc(db, 'published_pages', cleanId);
    let snap = await getDoc(pubDocRef);

    // 2. If not found in published_pages, check `sdui_pages/{cleanId}` (legacy bridge)
    if (!snap.exists()) {
      const sduiDocRef = doc(db, 'sdui_pages', cleanId);
      snap = await getDoc(sduiDocRef);
    }

    // 3. If still not found and cleanId is not 'home', fallback to 'home'
    if (!snap.exists() && cleanId !== 'home') {
      const homeDocRef = doc(db, 'published_pages', 'home');
      snap = await getDoc(homeDocRef);
    }

    if (snap.exists()) {
      const layout = normalizeLayoutDocument(cleanId, snap.data(), context);
      await cacheLayout(cleanId, layout);
      return layout;
    }
  } catch (fetchErr) {
    console.warn(`[SDUIService] Network fetch failed for "${cleanId}", reading cache:`, fetchErr);
  }

  // 4. Fallback to cached layout
  const cached = await getCachedLayout(cleanId);
  if (cached && cached.blocks && cached.blocks.length > 0) {
    return cached;
  }

  // 5. Ultimate fallback: Baked-in default home layout
  return DEFAULT_HOME_LAYOUT;
}

/**
 * Real-time subscription to a server-driven screen layout.
 * Emits whenever the admin publishes a new layout in App Studio.
 */
export function subscribeToScreenLayout(
  screenId: string,
  context: UserTargetingContext | undefined,
  onUpdate: (layout: ServerDrivenScreenLayout) => void,
  onError?: (err: Error) => void
): () => void {
  const cleanId = (screenId || 'home').toLowerCase().trim();
  const pubDocRef = doc(db, 'published_pages', cleanId);

  // First emit cached layout immediately for 0ms render
  getCachedLayout(cleanId).then((cached) => {
    if (cached) {
      onUpdate(cached);
    }
  });

  const unsubscribe = onSnapshot(
    pubDocRef,
    async (docSnap) => {
      if (docSnap.exists()) {
        const layout = normalizeLayoutDocument(cleanId, docSnap.data(), context);
        await cacheLayout(cleanId, layout);
        onUpdate(layout);
      } else {
        // Fallback to one-time resolution if published_pages doesn't have it
        const fallbackLayout = await fetchScreenLayout(cleanId, context);
        onUpdate(fallbackLayout);
      }
    },
    async (err) => {
      console.warn(`[SDUIService] Snapshot listener error on "${cleanId}":`, err);
      if (onError) onError(err);
      // Fallback to cache/default on listener error
      const fallbackLayout = await fetchScreenLayout(cleanId, context);
      onUpdate(fallbackLayout);
    }
  );

  return unsubscribe;
}
