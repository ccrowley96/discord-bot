const firebase = require('firebase');
const env = require('dotenv').config();

let firebaseConfig = {
    apiKey: process.env.apiKey_firebase,
    authDomain: process.env.authDomain_firebase,
    databaseURL: process.env.databaseURL_firebase,
    projectId: process.env.projectId_firebase,
    storageBucket: process.env.storageBucket_firebase,
    messagingSenderId: process.env.messagingSenderId_firebase,
    appId: process.env.appId_firebase,
    measurementId: process.env.measurementId_firebase
}

let app = firebase.initializeApp(firebaseConfig);

firebase.analytics();

module.exports = app;