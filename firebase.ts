import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB5v3nM9gB4D44NNydNTFA0waIELmozUyg",
  authDomain: "time-burner.firebaseapp.com",
  projectId: "time-burner",
  storageBucket: "time-burner.firebasestorage.app",
  messagingSenderId: "90912934001",
  appId: "1:90912934001:web:95a7152bd6f4a3527fb3d0",
  measurementId: "G-3QJ2CDP72V"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
