/*
 * LOKIVELLI SPLIT-SITE BRIDGE v1
 * Browser-to-browser, user-approved artifact relay to cooperating iframe pages.
 * NO access to third-party chats, cookies, OAuth tokens, or files unless user
 * explicitly selected a file and pressed PUSH.
 *
 * Protocol: receiver replies to HELLO with READY, then receives FILE only
 * after an explicit click. Events carry only documented metadata and a Blob.
 */
(function(){
'use strict';
if(document.body.dataset.view!=='switchyard')return;
var ready={left:false,right:false},transferIds={left:new Set(),right:new Set()};
var regKey='lokivelli.switchyard.v1';
var $=function(id){return document.getElementById(id);};
function current(){try{return JSON.parse(localStorage.getItem(regKey)||'{}');}catch(e){return {};}}
function expected(side){var frame=$(side+'Frame');try{return new URL(frame.src,location.href).origin;}catch(e){return null;}}
function frameFor(side){return $(side+'Frame');}
function external(side){return current()[side+'Mode']==='embed';}
function setFoot(side,msg){var el=$(side+'Foot');if(el)el.textContent=msg;}
function hello(side){
 if(!external(side))return;var f=frameFor(side),origin=expected(side);
 if(!origin||origin==='null')return;
 try{f.contentWindow.postMessage({type:'LV_SWITCHYARD_HELLO',version:1,side:side,sourceOrigin:location.origin},origin);}catch(e){}
}
['left','right'].forEach(function(side){
 var f=frameFor(side);
 f.addEventListener('load',function(){ready[side]=false;if(external(side)){hello(side);setTimeout(function(){hello(side);},900);}});
});
window.addEventListener('message',function(event){
 for(var side of ['left','right']){
   var f=frameFor(side);
   if(!external(side)||!f||event.source!==f.contentWindow||event.origin!==expected(side))continue;
   var data=event.data||{};
   if(data.type==='LV_SWITCHYARD_READY'&&data.version===1){
     ready[side]=true;setFoot(side,'BRIDGE READY · '+event.origin+' · user-approved transfers only');
   }
   if(data.type==='LV_SWITCHYARD_ACK'&&data.version===1&&transferIds[side].has(data.transferId)){
     transferIds[side].delete(data.transferId);setFoot(side,(data.accepted?'RECEIVED · ':'REJECTED · ')+(data.fileName||'artifact')+' · '+event.origin);
   }
 }
});
function allFiles(){return new Promise(function(ok,bad){
 var req=indexedDB.open('lokivelli-switchyard-artifacts',1);
 req.onerror=function(){bad(req.error);};
 req.onsuccess=function(){var db=req.result;var tx=db.transaction('files','readonly'),r=tx.objectStore('files').getAll();r.onsuccess=function(){ok(r.result);};r.onerror=function(){bad(r.error);};};
});}
async function deliver(side){
 if(!external(side))return;
 if(!ready[side]){setFoot(side,'NO COMPATIBLE BRIDGE · local relay receipt recorded, external upload not delivered');return;}
 var checks=Array.from(document.querySelectorAll('.filepick:checked'));
 if(!checks.length)return;
 var map={};(await allFiles()).forEach(function(f){map[f.id]=f;});
 var origin=expected(side),frame=frameFor(side);
 for(var cb of checks){
   var file=map[cb.value];if(!file)continue;
   var tid=crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random();
   transferIds[side].add(tid);
   frame.contentWindow.postMessage({
     type:'LV_SWITCHYARD_FILE',version:1,transferId:tid,sourceOrigin:location.origin,
     name:file.name,size:file.size,mimeType:file.type||'application/octet-stream',
     sha256:file.hash,blob:file.blob
   },origin);
   setFoot(side,'SENT TO RECEIVER · '+file.name+' · waiting for ACK');
 }
}
['left','right'].forEach(function(side){var b=$(side==='left'?'pushLeft':'pushRight');if(b)b.addEventListener('click',function(){deliver(side).catch(function(e){setFoot(side,'Bridge error · '+e.message);});});});
})();