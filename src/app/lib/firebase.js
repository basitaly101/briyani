// 1️⃣ Firebase Core
import { initializeApp } from "firebase/app";

// 2️⃣ Firebase Auth (User Authentication)
import { getAuth } from "firebase/auth";

// 3️⃣ Firebase Firestore (Database)
import { getFirestore } from "firebase/firestore";

// 🔗 Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-Ry2djbpsznhQrb9TJ6hc2rVO5JARsEI",
  authDomain: "ai-clinic-manager.firebaseapp.com",
  projectId: "ai-clinic-manager",
  storageBucket: "ai-clinic-manager.appspot.com",
  messagingSenderId: "503448571281",
  appId: "1:503448571281:web:c9fec07e1252e5072cde30"
};

// 4️⃣ Initialize Firebase App
const app = initializeApp(firebaseConfig);

// 5️⃣ Initialize Auth & Firestore
export const auth = getAuth(app);        // Authentication
export const db = getFirestore(app);     // Firestore Database