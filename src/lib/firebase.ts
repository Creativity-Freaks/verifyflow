import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "winged-city-66pck",
  appId: "1:807111038568:web:77785adfe6c68c586e8ddd",
  apiKey: "AIzaSyCcBgZKEi2IcIcUwKaJwxV4Id4Okwcqawk",
  authDomain: "winged-city-66pck.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-ticketverificati-e6f0a0d0-87b9-48f4-a97d-03095b378f83",
  storageBucket: "winged-city-66pck.firebasestorage.app",
  messagingSenderId: "807111038568"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
