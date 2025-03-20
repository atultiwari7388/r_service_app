import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_F_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_F_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_F_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_F_STORAGE_B,
  messagingSenderId: process.env.NEXT_PUBLIC_F_MESSENGER_SID,
  appId: process.env.NEXT_PUBLIC_F_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_F_MEASUR_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const analytics = isSupported().then((yes) =>
  yes ? getAnalytics(app) : null
);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
