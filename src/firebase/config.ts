import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// NOTE: These are placeholders. In a real scenario, these would come from .env
const firebaseConfig = {
    apiKey: "PLACEHOLDER",
    authDomain: "ploxiano-survivors.firebaseapp.com",
    projectId: "ploxiano-survivors",
    storageBucket: "ploxiano-survivors.appspot.com",
    messagingSenderId: "PLACEHOLDER",
    appId: "PLACEHOLDER",
    databaseURL: "https://ploxiano-survivors-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
