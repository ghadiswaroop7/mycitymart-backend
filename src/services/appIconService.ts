import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

export type AllowedAppIcon =
  | 'default_icon'
  | 'diwali_icon'
  | 'sale_icon'
  | 'independence_icon';

const VALID_ICONS: AllowedAppIcon[] = [
  'default_icon',
  'diwali_icon',
  'sale_icon',
  'independence_icon',
];

const ASYNC_STORAGE_ICON_KEY = '@bazarpeth_active_app_icon';

// Lazy loader for native-only module to prevent crash on Web / Expo Go
let DynamicAppIconModule: any = null;

function getDynamicAppIconModule() {
  if (Platform.OS === 'web') return null;
  if (!DynamicAppIconModule) {
    try {
      DynamicAppIconModule = require('expo-dynamic-app-icon');
    } catch (e) {
      return null;
    }
  }
  return DynamicAppIconModule;
}

/**
 * Programmatically changes the app icon on iOS & Android safely.
 */
export async function changeAppIcon(iconName: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  const module = getDynamicAppIconModule();
  if (!module || typeof module.setAppIcon !== 'function') {
    return false;
  }

  try {
    const targetIcon = iconName?.trim();
    const isDefault = !targetIcon || targetIcon === 'default_icon' || targetIcon === 'default';
    const normalizedTarget = isDefault ? 'default_icon' : targetIcon;

    if (!isDefault && !VALID_ICONS.includes(normalizedTarget as AllowedAppIcon)) {
      console.warn(`⚠️ [AppIconService] Unknown icon name: "${iconName}". Skipping.`);
      return false;
    }

    // Check last stored icon to avoid Android activity-alias restart loops
    const lastStored = await AsyncStorage.getItem(ASYNC_STORAGE_ICON_KEY);
    if (lastStored === normalizedTarget) {
      // Already set previously, prevent triggering Android process restart
      return true;
    }

    // On Android, only change icon if actually different to prevent crash loop
    await AsyncStorage.setItem(ASYNC_STORAGE_ICON_KEY, normalizedTarget);
    
    // Only invoke native setAppIcon if not already the active icon
    try {
      const currentNativeIcon = typeof module.getAppIcon === 'function' ? module.getAppIcon() : null;
      if (currentNativeIcon === normalizedTarget) {
        return true;
      }
      module.setAppIcon(normalizedTarget);
    } catch (nativeErr) {
      console.warn('⚠️ [AppIconService] Native setAppIcon skipped or failed:', nativeErr);
    }

    return true;
  } catch (error) {
    console.error('🔴 [AppIconService] Failed to set app icon:', error);
    return false;
  }
}

/**
 * Real-time listener for Firestore `app_settings/global_config`.
 */
export function listenToGlobalAppIconConfig(onIconChanged?: (icon: string) => void): () => void {
  if (Platform.OS === 'web') {
    return () => {};
  }

  try {
    const configDocRef = doc(db, 'app_settings', 'global_config');

    const unsubscribe = onSnapshot(
      configDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const activeIcon = data?.active_app_icon || data?.activeAppIcon || 'default_icon';
          
          if (activeIcon) {
            // Delay icon change to not interfere with initial boot
            setTimeout(() => {
              changeAppIcon(activeIcon);
              onIconChanged?.(activeIcon);
            }, 3000);
          }
        }
      },
      (error) => {
        console.error('🔴 [AppIconService] Error listening to global_config:', error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('🔴 [AppIconService] Listener setup error:', err);
    return () => {};
  }
}
