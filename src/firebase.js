// Firebase'i projenize ekleyin
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDEqE0_Aa6dhRNHYNQuLnq0aLJD7USJcIg",
  authDomain: "guidecreator-7a37f.firebaseapp.com",
  projectId: "guidecreator-7a37f",
  storageBucket: "guidecreator-7a37f.appspot.com",
  messagingSenderId: "99516860843",
  appId: "1:99516860843:web:550daef61adc9867292aee",
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Storage ve Firestore referanslarını al
const storage = getStorage(app);
const db = getFirestore(app);

export { storage, db };
