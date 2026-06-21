import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, persistentSingleTabManager, getFirestore } from 'firebase/firestore';
import { initializeAuth, getAuth, browserLocalPersistence } from 'firebase/auth';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// ---------------------------------------------------------------------------
// App — Prevent duplicate initialization (safe for hot-reload)
// ---------------------------------------------------------------------------
let app;
try {
  app = getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];
} catch (e) {
  console.warn('[Firebase] App init error, attempting recovery:', e);
  app = getApps()[0];
}

// ---------------------------------------------------------------------------
// Firestore — Offline persistence with hot-reload safety
// ---------------------------------------------------------------------------
let dbInstance;
try {
  dbInstance = getFirestore(app);
} catch (_) {
  try {
    dbInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: Platform.OS === 'web'
          ? persistentMultipleTabManager()
          : persistentSingleTabManager({}),
      }),
    });
  } catch (_inner) {
    dbInstance = getFirestore(app);
  }
}

export const db = dbInstance;

// ---------------------------------------------------------------------------
// Auth — CRITICAL: On React Native, we MUST use initializeAuth() with
// getReactNativePersistence(AsyncStorage) as the FIRST call. Calling
// getAuth() first silently sets indexedDB persistence (web-only), which
// causes an asynchronous crash on Android.
//
// getAuth() is ONLY safe as a fallback when auth is already initialized
// (e.g., during hot-reload).
// ---------------------------------------------------------------------------
let authInstance: ReturnType<typeof getAuth>;

try {
  if (Platform.OS === 'web') {
    // Web: initializeAuth with browserLocalPersistence, fall back to getAuth
    try {
      authInstance = initializeAuth(app, {
        persistence: browserLocalPersistence,
      });
    } catch (_) {
      // Already initialized (hot-reload) — safe to use getAuth on web
      authInstance = getAuth(app);
    }
  } else {
    // React Native (Android/iOS): MUST use initializeAuth with AsyncStorage
    try {
      const { getReactNativePersistence } = require('firebase/auth');
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;

      authInstance = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch (initError: any) {
      // initializeAuth throws "already-initialized" on hot-reload — safe to fallback
      if (initError?.code === 'auth/already-initialized') {
        authInstance = getAuth(app);
      } else {
        // Log but don't crash — fall back to getAuth as last resort
        console.warn('[Firebase] Auth init error:', initError?.message || initError);
        authInstance = getAuth(app);
      }
    }
  }
} catch (outerError) {
  console.error('[Firebase] Critical auth error, falling back to getAuth:', outerError);
  authInstance = getAuth(app);
}

export const auth = authInstance;

export { app };
export default app;
