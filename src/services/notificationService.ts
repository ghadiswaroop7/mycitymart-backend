import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { subscribeToUserOrders } from './firestoreService';

// Configure notification behavior for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const saveUserPushToken = async (uid: string, token: string) => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      pushToken: token,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Error saving push token to Firestore:', error);
  }
};

export const registerForPushNotificationsAsync = async (uid?: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return null;
  }

  let token: string | null = null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push notification permission');
      return null;
    }

    // Get Expo Push Token
    const pushTokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
    token = pushTokenData?.data || null;

    if (token && uid) {
      await saveUserPushToken(uid, token);
    }
  } catch (error) {
    console.warn('Notification permission/token registration skipped or unavailable:', error);
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#008B45',
    });
  }

  return token;
};

// Listen to order status changes in Firestore and trigger local notification when order is out for delivery
const notifiedOrderStatusCache: Record<string, string> = {};

export const setupOrderStatusNotificationListener = (uid: string) => {
  if (!uid) return () => {};

  return subscribeToUserOrders(uid, (orders) => {
    orders.forEach((order: any) => {
      const orderId = order.id;
      const currentStatus = order.status?.toLowerCase();
      const prevStatus = notifiedOrderStatusCache[orderId];

      if (currentStatus && prevStatus !== currentStatus) {
        notifiedOrderStatusCache[orderId] = currentStatus;

        // Trigger notification if status changed to out_for_delivery or picked_up
        if (['picked_up', 'out_for_delivery', 'on_the_way'].includes(currentStatus) && prevStatus) {
          triggerLocalNotification(
            'Your Order is Out for Delivery 🛵',
            `Order #${orderId.substring(0, 8).toUpperCase()} is on the way with your rider!`
          );
        } else if (currentStatus === 'delivered' && prevStatus && prevStatus !== 'delivered') {
          triggerLocalNotification(
            'Order Delivered! 🎉',
            `Order #${orderId.substring(0, 8).toUpperCase()} has been delivered successfully. Enjoy your purchase!`
          );
        }
      } else if (currentStatus && !prevStatus) {
        // Initial load cache
        notifiedOrderStatusCache[orderId] = currentStatus;
      }
    });
  });
};

export const triggerLocalNotification = async (title: string, body: string) => {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // trigger immediately
    });
  } catch (error) {
    console.error('Error triggering local notification:', error);
  }
};
