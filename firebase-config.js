// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDpAQMB1CBErzpyWvAIVL4ZIgsCwxIxMYE",
    authDomain: "oera-crm.firebaseapp.com",
    projectId: "oera-crm",
    storageBucket: "oera-crm.firebasestorage.app",
    messagingSenderId: "385555917254",
    appId: "1:385555917254:web:e21c1d5cdad8ab74524ac7",
    measurementId: "G-1SDSYQYHE7",
    databaseURL: "https://oera-crm-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
