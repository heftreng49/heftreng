import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// ── FCM token kaydet ────────────────────────────────────────────
export async function saveFCMToken() {
  const user = auth().currentUser;
  if (!user) return;
  try {
    const token = await messaging().getToken();
    if (token) {
      await firestore().collection('users').doc(user.uid).set(
        { fcmToken: token, fcmUpdated: firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
    }
  } catch (e) { console.log('FCM token hatası:', e); }
}

// ── Bildirim yaz + pushQueue'ya ekle (web ile aynı sistem) ─────
export async function sendInAppNotification({ toUid, type, fromUser, extra = {} }) {
  if (!toUid || !fromUser) return;

  const messages = {
    like:    `${fromUser.name} gönderini beğendi ❤️`,
    comment: `${fromUser.name} gönderine yorum yaptı 💬`,
    follow:  `${fromUser.name} seni takip etmeye başladı 👤`,
    save:    `${fromUser.name} gönderini kaydetti 🔖`,
  };
  const msg = messages[type] || 'Yeni bildirim';

  // 1. userNotifs — web'deki alan adlarıyla
  try {
    await firestore()
      .collection('users').doc(toUid)
      .collection('userNotifs').add({
        userId:    toUid,
        type,
        message:   msg,
        fromUid:   fromUser.uid   || '',
        fromName:  fromUser.name  || 'Kullanıcı',
        fromPhoto: fromUser.photo || '',
        url:       '',
        read:      false,
        createdAt: firestore.FieldValue.serverTimestamp(),
        ...extra,
      });
  } catch (e) { console.log('userNotifs yazma hatası:', e); }

  // 2. pushQueue — Cloud Function bunu okuyup FCM push gönderir
  try {
    await firestore().collection('pushQueue').add({
      targetUid: toUid,
      title:     'Heftreng',
      body:      msg,
      url:       '',
      ts:        firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) { console.log('pushQueue yazma hatası:', e); }
}

// ── FCM kurulumu ────────────────────────────────────────────────
export async function setupFCM(navigationRef) {
  try {
    const status = await messaging().requestPermission();
    const ok =
      status === messaging.AuthorizationStatus.AUTHORIZED ||
      status === messaging.AuthorizationStatus.PROVISIONAL;
    if (!ok) return;

    await saveFCMToken();

    messaging().onTokenRefresh(async token => {
      const user = auth().currentUser;
      if (user) {
        await firestore().collection('users').doc(user.uid)
          .set({ fcmToken: token, fcmUpdated: firestore.FieldValue.serverTimestamp() }, { merge: true });
      }
    });

    messaging().onMessage(async msg => {
      console.log('Foreground bildirim:', msg.notification?.title);
    });

    messaging().onNotificationOpenedApp(msg => {
      _navigate(msg, navigationRef);
    });

    messaging().getInitialNotification().then(msg => {
      if (msg) _navigate(msg, navigationRef);
    });
  } catch (e) { console.log('FCM kurulum hatası:', e); }
}

function _navigate(msg, ref) {
  if (!ref?.isReady?.()) return;
  const d = msg?.data || {};
  if (d.type === 'follow')  ref.navigate('Profile', { uid: d.fromUid });
  else if (d.convId)        ref.navigate('Chat', { convId: d.convId, otherUid: d.otherUid, otherName: d.otherName || '', otherPhoto: d.otherPhoto || '' });
  else                      ref.navigate('Main');
}
