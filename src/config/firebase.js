import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { collection, addDoc } from "@firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBqd2bL6qREBtZqnmBnBUYDptT618QjVyM",
    authDomain: "nodado-portfolio.firebaseapp.com",
    projectId: "nodado-portfolio",
    storageBucket: "nodado-portfolio.firebasestorage.app", 
    messagingSenderId: "896748957589",
    appId: "1:896748957589:web:b6c542b887f438f01b909c",
    measurementId: "G-DLG7VQ1PJR"
};

const app = initializeApp(firebaseConfig, 'trackntoms-pos');
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage, collection, addDoc };