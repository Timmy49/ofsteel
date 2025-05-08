// ==UserScript==
// @name         OFSteel DownLoc
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  OFS JSON-RPC local download file
// @match        https://www.ofs.edu.sg/my-ofs/*
// @grant        none
// ==/UserScript==

(function(){
  'use strict';

  let pageInfoLoaded = false;
  const seenBodies = new Set();
  const pattern = /"password":\s*\{"javaClass":\s*"java\.util\.ArrayList",\s*"list":\s*\[([^\]]+)\]/;

  function tryDownload(body){
    const m = body.match(pattern);
    if(!m) return false;
    const extracted = m[1].replace(/"/g,'').trim();
    console.log('🔍 listing_w list =', extracted);
    const blob = new Blob([body], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${extracted}.txt`;
    a.click();
    return true;
  }

  // FETCH hook
  const origFetch = window.fetch;
  window.fetch = async (...args) => {
    const [res, cfg] = args;
    const url = typeof res==='string'?res:res.url;
    const body = cfg?.body;
    if(!pageInfoLoaded && url.includes('page-info.json')){
      pageInfoLoaded = true;
      console.log('✅ page-info.json loaded (fetch)');
    }
    if(pageInfoLoaded && url.includes('JSON-RPC') && body && !seenBodies.has(body)){
      seenBodies.add(body);
      console.log('📦 JSON-RPC FETCH detected');
      console.log('📤 Raw Payload:', body);
      if(!tryDownload(body)){
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
      if(!pageInfoLoaded && this._url.includes('page-info.json')){
        pageInfoLoaded = true;
        console.log('✅ page-info.json loaded (XHR)');
      }
      if(pageInfoLoaded && this._url.includes('JSON-RPC') && body && !seenBodies.has(body)){
        seenBodies.add(body);
        console.log('📦 JSON-RPC XHR detected');
        console.log('📤 Raw Payload:', body);
        if(!tryDownload(body)){
          console.log('⚠ pattern not found → skipping');
        }
      }
    });
    return origXHRSend.apply(this, arguments);
  };

})();
