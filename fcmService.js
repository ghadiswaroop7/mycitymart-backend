import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();
const messaging = getMessaging();

export const sendToUser = async (fcmToken, notification, data = {}) => {
  const message = {
    token: fcmToken,
    notification: {
      title: notification.title,
      body: notification.body,
      ...(notification.imageUrl && { imageUrl: notification.imageUrl })
    },
    data: data,
    android: {
      priority: 'high',
      notification: { sound: 'default' }
    }
  };
  return messaging.send(message);
};

export const sendToAll = async (notification, data = {}) => {
  const usersSnapshot = await db.collection('users')
    .where('fcmToken', '!=', null).get();
  const tokens = usersSnapshot.docs.map(doc => doc.data().fcmToken).filter(Boolean);
  if (tokens.length === 0) return { successCount: 0, failureCount: 0 };
  const message = {
    tokens,
    notification: { title: notification.title, body: notification.body },
    data,
    android: { priority: 'high', notification: { sound: 'default' } }
  };
  return messaging.sendEachForMulticast(message);
};

export const sendToSegment = async (segment, notification, data = {}) => {
  const usersSnapshot = await db.collection('users')
    .where('preferences.segment', '==', segment)
    .where('fcmToken', '!=', null).get();
  const tokens = usersSnapshot.docs.map(d => d.data().fcmToken).filter(Boolean);
  if (tokens.length === 0) return { successCount: 0, failureCount: 0 };
  const message = {
    tokens,
    notification: { title: notification.title, body: notification.body },
    data,
    android: { priority: 'high', notification: { sound: 'default' } }
  };
  return messaging.sendEachForMulticast(message);
};

export const startNotificationWorker = () => {
  console.log('🔔 Started FCM Notification Worker...');
  db.collection('notifications')
    .where('status', '==', 'pending')
    .onSnapshot(async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const docId = change.doc.id;
          const payload = change.doc.data();
          try {
            await db.collection('notifications').doc(docId).update({ status: 'processing' });
            const notifPayload = { title: payload.title, body: payload.body, imageUrl: payload.imageUrl };
            const dataPayload = { deepLink: payload.deepLink || 'none' };
            let response;
            if (payload.targetSegment === 'all') {
              response = await sendToAll(notifPayload, dataPayload);
            } else if (payload.targetSegment === 'specific' && payload.specificUserId) {
              const userDoc = await db.collection('users').doc(payload.specificUserId).get();
              if (userDoc.exists && userDoc.data().fcmToken) {
                response = await sendToUser(userDoc.data().fcmToken, notifPayload, dataPayload);
                response = { successCount: 1, failureCount: 0 };
              } else {
                throw new Error('User does not have an FCM token.');
              }
            } else {
              response = await sendToSegment(payload.targetSegment, notifPayload, dataPayload);
            }
            await db.collection('notifications').doc(docId).update({
              status: 'sent',
              sentAt: new Date(),
              successCount: response.successCount || 0,
              failureCount: response.failureCount || 0
            });
            console.log(`✅ Notification sent [${docId}]`);
          } catch (error) {
            console.error(`❌ Error sending notification [${docId}]:`, error);
            await db.collection('notifications').doc(docId).update({ status: 'failed', error: error.message });
          }
        }
      }
    });
};

export { db };
