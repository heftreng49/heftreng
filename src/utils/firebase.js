import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON } from '../constants/config';

// Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Firebase shortcuts
export const db      = firestore();
export const fbAuth  = auth();
export const fcm     = messaging();

// Cloudinary fotoğraf yükleme
export async function uploadImage(uri, folder = 'posts') {
  const CLOUD  = 'dmmkr98us';
  const PRESET = 'heftreng_upload';
  const data   = new FormData();
  data.append('file', { uri, type: 'image/jpeg', name: 'photo.jpg' });
  data.append('upload_preset', PRESET);
  data.append('folder', folder);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`,
    { method: 'POST', body: data }
  );
  const json = await res.json();
  return json.secure_url;
}

// Bildirim izni iste
export async function requestNotifPermission() {
  const authStatus = await messaging().requestPermission();
  return authStatus === messaging.AuthorizationStatus.AUTHORIZED
      || authStatus === messaging.AuthorizationStatus.PROVISIONAL;
}
