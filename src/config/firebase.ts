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

// Prevent duplicate app initialization
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

// Enable Firestore Offline Persistence with hot-reload safety
let dbInstance;
try {
  // Try to retrieve existing instance if already initialized (hot reload)
  dbInstance = getFirestore(app);
} catch (e) {
  try {
    dbInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: Platform.OS === 'web'
          ? persistentMultipleTabManager()
          : persistentSingleTabManager({}),
      }),
    });
  } catch (error: any) {
    dbInstance = getFirestore(app);
  }
}

export const db = dbInstance;

// ---------------------------------------------------------------------------
// Auth — Setup cross-platform persistence (AsyncStorage for mobile, BrowserLocal for web)
// ---------------------------------------------------------------------------
let authInstance: ReturnType<typeof getAuth>;

try {
  // Try to retrieve existing instance if already initialized (hot reload)
  authInstance = getAuth(app);
} catch (e) {
  try {
    const persistence = Platform.OS === 'web'
      ? browserLocalPersistence
      : (() => {
          const { getReactNativePersistence } = require('firebase/auth');
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          return getReactNativePersistence(AsyncStorage);
        })();

    authInstance = initializeAuth(app, {
      persistence,
    });
  } catch (error: any) {
    // Fallback if initializeAuth fails due to double initialization race conditions
    authInstance = getAuth(app);
  }
}

export const auth = authInstance;

// Functions is not used in the mobile app; commented out to prevent startup crashes on Android
// export const functions = require('firebase/functions').getFunctions(app);

export { app };
export default app;
