importScripts("https://www.gstatic.com/firebasejs/7.23.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/7.23.0/firebase-messaging.js");

firebase.initializeApp(
    {
        apiKey: "AIzaSyCy6TYS3eAtb1fJP3VmzYZJmlCoIk2jY6I",
        authDomain: "diamante-de4da.firebaseapp.com",
        projectId: "diamante-de4da",
        storageBucket: "diamante-de4da.appspot.com",
        messagingSenderId: "367960941026",
        appId: "1:367960941026:web:e440c0ee7ad97ba09a19bb",
        measurementId: "G-KF7ZS283PJ"
      }
)
const messaging= firebase.messaging();