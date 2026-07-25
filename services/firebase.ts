import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC-ahFUiauC_MQsDBJ1KHRM6rmM-nch2zU",
  authDomain: "dtc-manager-e4faf.firebaseapp.com",
  projectId: "dtc-manager-e4faf",
  storageBucket: "dtc-manager-e4faf.firebasestorage.app",
  messagingSenderId: "641019742360",
  appId: "1:641019742360:web:eb4baec63ec00913ba68ed"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Use the explicit firestore database ID from firebase-applet-config.json
export const db = initializeFirestore(app, {}, "ai-studio-remixdtcmanagerp-88f2f60a-19a9-4db6-a256-75b18f5f98c9");
