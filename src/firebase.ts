import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDjoDGycg6jLToxiBNTmEcEut9jSeSDMsE",
  authDomain: "hopehouse-5041d.firebaseapp.com",
  projectId: "hopehouse-5041d",
  storageBucket: "hopehouse-5041d.firebasestorage.app",
  messagingSenderId: "326505506195",
  appId: "1:326505506195:web:77137a7ac85e049215b466",
  measurementId: "G-LDRP996XFH",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Use long-polling for Firestore in the web app.
// This avoids browser/proxy networking issues that can leave Firestore
// reads/writes hanging indefinitely while Firebase Authentication still works.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export default app;
