import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { saveFCMToken } from '../utils/notifications';

GoogleSignin.configure({
  webClientId: '854520441903-c8n3ugstsv6pgk6getrqo543nd0lv7qc.apps.googleusercontent.com',
});

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(undefined);
  const [profile,     setProfile]     = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const profileUnsubRef = useRef(null); // gerçek zamanlı profil listener

  useEffect(() => {
    const authUnsub = auth().onAuthStateChanged(async (firebaseUser) => {
      // Önceki profil listener'ı temizle
      if (profileUnsubRef.current) {
        profileUnsubRef.current();
        profileUnsubRef.current = null;
      }

      setUser(firebaseUser);

      if (firebaseUser) {
        const userRef = firestore().collection('users').doc(firebaseUser.uid);

        // İlk girişte profil oluştur
        const doc = await userRef.get();
        if (!doc.exists) {
          await userRef.set({
            uid:            firebaseUser.uid,
            name:           firebaseUser.displayName || '',
            displayName:    firebaseUser.displayName || '',
            photoURL:       firebaseUser.photoURL    || '',
            email:          firebaseUser.email       || '',
            bio:            '',
            website:        '',
            coverURL:       '',
            pinnedPost:     '',
            followerCount:  0,
            followingCount: 0,
            postCount:      0,
            score:          0,
            kf_xp:          0,
            kf_streak:      0,
            kf_done:        [],
            lastSeen:       firestore.FieldValue.serverTimestamp(),
            createdAt:      firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        }

        // Gerçek zamanlı profil listener — sayılar anında güncellenir
        profileUnsubRef.current = userRef.onSnapshot(snap => {
          if (snap.exists) setProfile({ id: snap.id, ...snap.data() });
        });

        saveFCMToken().catch(() => {});
        // Her giriş/açılışta lastSeen güncelle
        userRef.update({ lastSeen: firestore.FieldValue.serverTimestamp() }).catch(() => {});
      } else {
        setProfile(null);
      }

      setLoadingAuth(false);
    });

    return () => {
      authUnsub();
      if (profileUnsubRef.current) profileUnsubRef.current();
    };
  }, []);

  const signInWithGoogle = async () => {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const idToken  = userInfo.idToken ?? userInfo.data?.idToken;
    if (!idToken) throw new Error('idToken alınamadı');
    const cred = auth.GoogleAuthProvider.credential(idToken);
    const result = await auth().signInWithCredential(cred);
    return result.user;
  };

  const signOut = async () => {
    try { await GoogleSignin.signOut(); } catch (_) {}
    await auth().signOut();
  };

  const refreshProfile = async () => {
    if (!user) return;
    const doc = await firestore().collection('users').doc(user.uid).get();
    if (doc.exists) setProfile({ id: doc.id, ...doc.data() });
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loadingAuth,
      isLoggedIn: !!user,
      signInWithGoogle,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
