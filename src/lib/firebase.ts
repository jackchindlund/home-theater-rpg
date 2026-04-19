import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBISidBscNneYnYhw1XVn9K2WU4RWgbKHg",
  authDomain: "home-theater-rpg.firebaseapp.com",
  projectId: "home-theater-rpg",
  storageBucket: "home-theater-rpg.firebasestorage.app",
  messagingSenderId: "23807377940",
  appId: "1:23807377940:web:887e44147a389c253fdd01",
  measurementId: "G-46S0E8C6ZQ",
};

export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
