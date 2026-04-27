import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyCdnqyt3B2yru2i6tswPGvBJZt3o9ubcAs",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "cartiq-82fa9.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "cartiq-82fa9",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "cartiq-82fa9.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "756180458030",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:756180458030:web:a6a2e59a571934a42c1dbf"
};

const app = initializeApp(firebaseConfig);

// Use initializeAuth with AsyncStorage persistence on native, getAuth on web
// @ts-ignore - getReactNativePersistence exists at runtime on RN but not in web typings
const { getReactNativePersistence } = require('firebase/auth');

export const auth = Platform.OS === 'web'
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });

export const db = getFirestore(app);

export default app;
