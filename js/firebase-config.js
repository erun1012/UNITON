import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAJqmOSqV82lSSVukgLxUV2pb9qBNuG3f8",
  authDomain: "alz-zip.firebaseapp.com",
  projectId: "alz-zip",
  storageBucket: "alz-zip.appspot.com", 
  messagingSenderId: "999217669427",
  appId: "1:999217669427:web:2b5ccaf729d403391e0a46",
  measurementId: "G-4BX57WT4NR"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
