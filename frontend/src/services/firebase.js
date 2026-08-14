import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDrXznrM13-x_v5rvHyj2yqXO_b-27_72Y",
  authDomain: "ai-based-coding-lab-platform.firebaseapp.com",
  projectId: "ai-based-coding-lab-platform",
  storageBucket: "ai-based-coding-lab-platform.firebasestorage.app",
  messagingSenderId: "390336880545",
  appId: "1:390336880545:web:b67cb82f0d00132db0b5e0"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;