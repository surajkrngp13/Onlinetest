import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut,setPersistence,browserSessionPersistence } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";







const firebaseConfig = {
    apiKey: "AIzaSyDbkK1inremaHQDtUrB-DX5CkvcAeihieY",
    authDomain: "quizdb-9db17.firebaseapp.com",
    projectId: "quizdb-9db17",
    storageBucket: "quizdb-9db17.firebasestorage.app",
    messagingSenderId: "1064062597943",
    appId: "1:1064062597943:web:be4d3f136a370e5181f8b2"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);
const rtdb = getDatabase(app);

setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log("Firebase persistence set to sessionStorage – logout on browser close.");
  })
  .catch((error) => {
    console.error("Persistence error:", error);
  });









window.db = db;
window.auth = auth;
window.provider = provider;
window.signInWithPopup = signInWithPopup;
window.onAuthStateChanged = onAuthStateChanged;
window.signOut = signOut;
window.doc = doc;
window.getDoc = getDoc;
window.setDoc = setDoc;


// Also expose the auth and db directly
export { app, auth, provider, db, signInWithPopup, onAuthStateChanged, signOut, doc, getDoc, setDoc,rtdb, ref, get, set };
