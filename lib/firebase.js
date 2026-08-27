// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ✅ Correct Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyANhscICjLCaRIQIO2LYdmWs70fcF2z-MQ",
  authDomain: "quickparcel-next.firebaseapp.com",
  projectId: "quickparcel-next",
  storageBucket: "quickparcel-next.appspot.com", // ✅ FIXED!
  messagingSenderId: "60505420313",
  appId: "1:60505420313:web:40e2ca5cbb5ff325f6b088",
  measurementId: "G-EDDKSPPYPZ",
};

// ✅ Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ Export so you can use it in your app/page.js
export { app, auth, db };