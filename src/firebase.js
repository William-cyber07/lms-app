import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCf4QnrPK8S27FhFXOVsNlzJinGFPdV3qE",
  authDomain: "lms-app-24780.firebaseapp.com",
  projectId: "lms-app-24780",
  storageBucket: "lms-app-24780.firebasestorage.app",
  messagingSenderId: "332255557873",
  appId: "1:332255557873:web:23fb03c135825d6bf45150"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);