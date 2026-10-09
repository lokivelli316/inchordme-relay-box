/* Receiver starter for a PAGE BUILT BY ANOTHER PLATFORM.
   Before loading, set window.LV_ALLOWED_SWITCHYARD_ORIGINS on the receiver page.
   The browser prompts before any file is accepted and stores it on receiver origin. */
(function(){
'use strict';
var allowed=Array.isArray(window.LV_ALLOWED_SWITCHYARD_ORIGINS)?window.LV_ALLOWED_SWITCHYARD_ORIGINS:[];
var parentRef=null,parentOrigin=null;
var el=document.getElementById('lv-receiver-status');
function status(t){if(el)el.textContent=t;}
function id(){return window.crypto&&crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random();}
function save(file){
 return new Promise(function(ok,bad){
  var req=indexedDB.open('lv-independent-receiver',1);
  req.onupgradeneeded=function(){if(!req.result.objectStoreNames.contains('inbox'))req.result.createObjectStore('inbox',{keyPath:'id'});};
  req.onerror=function(){bad(req.error);};
  req.onsuccess=function(){var tx=req.result.transaction('inbox','readwrite');tx.objectStore('inbox').put(file);tx.oncomplete=function(){ok(file);};tx.onerror=function(){bad(tx.error);};};
 });
}
window.addEventListener('message',async function(e){
 if(!allowed.includes(e.origin))return;
 var d=e.data||{};
 if(d.type==='LV_SWITCHYARD_HELLO'&&d.version===1){
   parentRef=e.source;parentOrigin=e.origin;parentRef.postMessage({type:'LV_SWITCHYARD_READY',version:1},parentOrigin);
   status('Connected to '+e.origin+' (files require confirmation).');return;
 }
 if(d.type!=='LV_SWITCHYARD_FILE'||d.version!==1||parentRef!==e.source||parentOrigin!==e.origin)return;
 var accepted=false;
 try{
   if(!(d.blob instanceof Blob))throw Error('No file payload');
   if(d.blob.size!==d.size)throw Error('Size mismatch');
   accepted=confirm('Accept '+d.name+' ('+Math.ceil(d.size/1024)+' KB) from Switchyard?');
   if(accepted){
     await save({id:id(),name:d.name,size:d.size,sha256:d.sha256||null,mimeType:d.mimeType,blob:d.blob,receivedAt:Date.now(),sourceOrigin:e.origin});
     status('Accepted '+d.name+'. Stored only in this site\'s IndexedDB.');
     window.dispatchEvent(new CustomEvent('lv:received',{detail:{name:d.name,size:d.size}}));
   }else status('Transfer declined.');
 }catch(err){accepted=false;status('Transfer error: '+err.message);}
 parentRef.postMessage({type:'LV_SWITCHYARD_ACK',version:1,transferId:d.transferId,fileName:d.name,accepted:accepted},parentOrigin);
});
window.LVReceiverList=async function(){return new Promise(function(ok,bad){var r=indexedDB.open('lv-independent-receiver',1);r.onupgradeneeded=function(){if(!r.result.objectStoreNames.contains('inbox'))r.result.createObjectStore('inbox',{keyPath:'id'});};r.onsuccess=function(){var g=r.result.transaction('inbox','readonly').objectStore('inbox').getAll();g.onsuccess=function(){ok(g.result);};g.onerror=function(){bad(g.error);};};r.onerror=function(){bad(r.error);};});};
})();