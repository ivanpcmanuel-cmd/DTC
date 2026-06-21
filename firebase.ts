import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "firm-fusion-6ttsj",
  appId: "1:590605629722:web:3a26eb7517cc39e4e0d4a3",
  apiKey: "AIzaSyAL8z8aJmZQ9yS2p32ZUe06dcccLmIhv30",
  authDomain: "firm-fusion-6ttsj.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-88f2f60a-19a9-4db6-a256-75b18f5f98c9",
  storageBucket: "firm-fusion-6ttsj.firebasestorage.app",
  messagingSenderId: "590605629722",
  measurementId: ""
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { firebaseConfig };
