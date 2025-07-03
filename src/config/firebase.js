// Firebase設定 - Salone Ponte

const firebaseConfig = {
  apiKey: "AIzaSyAK14FMyp7VGYZPakGDmLdgHsvvxT-b0TM",
  authDomain: "salone-ponte-fceca.firebaseapp.com",
  projectId: "salone-ponte-fceca",
  storageBucket: "salone-ponte-fceca.appspot.com",
  messagingSenderId: "463711728652",
  appId: "1:463711728652:web:59c749e11d201b26b86a29",
  measurementId: "G-MPWGTB6R7C"
};

// Firebase初期化
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();