// js/firebase-init.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your web app's Firebase configuration (using your keys)
const firebaseConfig = {
  apiKey: "AIzaSyB_oL8lyp2-u2xQ2CXHr3WLPso5TjMDtB4",
  authDomain: "mskp25-ticketselling.firebaseapp.com",
  projectId: "mskp25-ticketselling",
  storageBucket: "mskp25-ticketselling.appspot.com",
  messagingSenderId: "933290004358",
  appId: "1:933290004358:web:5a07040d2c6b594dfd2607"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Export the database connection for other files to use
export { db };