/* Lokivelli Switchyard — local-first dual-bay file relay.
   OAuth access is intentionally NOT simulated; use a separately deployed authorized backend. */
(function () {
  'use strict';
  var ITEMS = [
    {id:'arsenalx',name:'PROMPT ARSENALX',url:'https://chatgpt.com/gpts',accent:'#eb90ad'},
    {id:'bible-maker',name:'BIBLE MAKER',url:'https://chatgpt.com/gpts',accent:'#e1b978'},
    {id:'chatgpt',name:'CHATGPT',url:'https://chatgpt.com/',accent:'#80ddcf'},
    {id:'claude',name:'CLAUDE',url:'https://claude.ai/',accent:'#e2a88d'},
    {id:'gemini',name:'GEMINI',url:'https://gemini.google.com/',accent:'#acc5ff'},
    {id:'grok',name:'GROK',url:'https://grok.com/',accent:'#e0dae6'},
    {id:'mistral',name:'MISTRAL',url:'https://chat.mistral.ai/',accent:'#f5ab70'},
    {id:'termux',name:'TERMUX / LOCAL',url:'http://127.0.0.1:8000/',accent:'#9cec9d'},
    {id:'custom',name:'YOUR SITE / CUSTOM',url:'https://github.com/lokivelli316/inchordme-relay-box',accent:'#d2b7ff'}
  ];
  var STORE_KEY = 'lokivelli.switchyard.v1', URL_KEY='lokivelli.switchyard.urls.v1', RELAY_KEY='lokivelli.switchyard.relay.v1';
  var BASE = { left:'arsenalx', right:'bible-maker', leftMode:'local', rightMode:'local', ratio:50, forceTwo:false, rail:true };
  var state = readJson(STORE_KEY, BASE);
  var urls = readJson(URL_KEY, {});
  var bus = ('BroadcastChannel' in window) ? new BroadcastChannel('lokivelli-forge-rail') : null;
  var $ = function (id) { return document.getElementById(id); };
  var dbPromise;
  var toastTimer;
  function readJson(k, fallback) { try { return Object.assign({},fallback,JSON.parse(localStorage.getItem(k)||'{}')); } catch(e) { return Object.assign({},fallback); } }
  function saveState(){ localStorage.setItem(STORE_KEY,JSON.stringify(state)); }
  function getItem(id) { return ITEMS.find(function(x){return x.id===id;}) || ITEMS[0]; }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function formatBytes(bytes) { if(bytes<1024)return bytes+' B'; if(bytes<1048576)return (bytes/1024).toFixed(1)+' KB';return (bytes/1048576).toFixed(1)+' MB'; }
  function notify(s) { var t=$('toast');if(t){t.textContent=s;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(function(){t.classList.remove('show');},4000);}else{ var box=$('bayMessage');if(box)box.textContent=s; } }
  function broadcast(reason) {if(bus)bus.postMessage({event:reason,at:Date.now()});}
  function urlFor(id) {return urls[id] || getItem(id).url;}
  function validUrl(value){try{ var v=new URL(value);return ['https:','http:'].includes(v.protocol) ? v.href : null;}catch(e){return null;}}
  function openDatabase() {
    if(!dbPromise) dbPromise=new Promise(function(resolve,reject){
      var req=indexedDB.open('lokivelli-switchyard-artifacts',1);
      req.onupgradeneeded=function(){var db=req.result;if(!db.objectStoreNames.contains('files')) db.createObjectStore('files',{keyPath:'id'});if(!db.objectStoreNames.contains('deliveries'))db.createObjectStore('deliveries',{keyPath:'id'});};
      req.onsuccess=function(){resolve(req.result);};req.onerror=function(){reject(req.error);};
    });
    return dbPromise;
  }
  async function storeAll(name) {var db=await openDatabase();return new Promise(function(ok,bad){var tx=db.transaction(name,'readonly');var r=tx.objectStore(name).getAll();r.onsuccess=function(){ok(r.result);};r.onerror=function(){bad(r.error);};});}
  async function storeGet(name,id) {var db=await openDatabase();return new Promise(function(ok,bad){var tx=db.transaction(name,'readonly');var r=tx.objectStore(name).get(id);r.onsuccess=function(){ok(r.result);};r.onerror=function(){bad(r.error);};});}
  async function storePut(name,obj) {var db=await openDatabase();return new Promise(function(ok,bad){var tx=db.transaction(name,'readwrite');tx.objectStore(name).put(obj);tx.oncomplete=function(){ok(obj);};tx.onerror=function(){bad(tx.error);};});}
  async function storeDelete(name,id) {var db=await openDatabase();return new Promise(function(ok,bad){var tx=db.transaction(name,'readwrite');tx.objectStore(name).delete(id);tx.oncomplete=function(){ok();};tx.onerror=function(){bad(tx.error);};});}
  function uid(){return (crypto && crypto.randomUUID) ? crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2);}
  async function fileHash(file) {if(!crypto.subtle) return 'unavailable';var b=await file.arrayBuffer();var bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',b));return Array.from(bytes).map(function(x){return x.toString(16).padStart(2,'0');}).join('');}
  async function addFiles(files) {
    var added=0;
    for(var file of files) {
      try{
        var hash=await fileHash(file).catch(function(){return 'unavailable';});
        await storePut('files',{id:uid(),name:file.name,size:file.size,type:file.type,hash:hash,blob:file,created:Date.now(),source:'local upload'});
        added++;
      }catch(e){ notify('File storage failed: '+e.message); }
    }
    await renderVault();broadcast('vault'); if(added)notify(added+' file(s) placed in shared browser vault.');
  }
  async function downloadFile(fileId) {
    var item=await storeGet('files',fileId);if(!item)return;
    var u=URL.createObjectURL(item.blob),a=document.createElement('a');a.href=u;a.download=item.name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},30000);
  }
  async function renderVault() {
    var host=$('vaultItems');if(!host)return;
    try{
      var files=(await storeAll('files')).sort(function(a,b){return b.created-a.created;});
      var bytes=files.reduce(function(sum,x){return sum+x.size;},0);
      $('storageStat').textContent='• '+files.length+' FILES / '+formatBytes(bytes);
      host.innerHTML=files.length?files.map(function(f){
        return '<div class="fileitem"><input type="checkbox" class="filepick" value="'+escapeHtml(f.id)+'" aria-label="Select '+escapeHtml(f.name)+'"><div class="filedesc"><div class="filename" title="'+escapeHtml(f.name)+'">'+escapeHtml(f.name)+'</div><div class="filemeta">'+formatBytes(f.size)+' · SHA '+escapeHtml(f.hash.slice(0,12))+'</div></div><button data-download="'+escapeHtml(f.id)+'" title="Download only when you want to">↓</button><button data-delete="'+escapeHtml(f.id)+'" title="Remove local vault copy">×</button></div>';
      }).join(''):'<p class="empty">Empty browser vault. Add files once; push references between owned workspace pages without downloading again.</p>';
      host.querySelectorAll('[data-download]').forEach(function(b){b.addEventListener('click',function(){downloadFile(b.dataset.download);});});
      host.querySelectorAll('[data-delete]').forEach(function(b){b.addEventListener('click',async function(){if(!confirm('Delete this vault copy? Delivery receipts remain.'))return;await storeDelete('files',b.dataset.delete);broadcast('vault');renderVault();});});
    }catch(e){host.textContent='Browser file storage unavailable: '+e.message;}
  }
  async function push(side) {
    var picks=Array.from(document.querySelectorAll('.filepick:checked')).map(function(c){return c.value;});
    if(!picks.length){notify('Select files in the Artifact Rail first.');return;}
    var p=state[side];for(var id of picks) await storePut('deliveries',{id:uid(),fileId:id,destSide:side,platform:p,source:'operator push',status:'pending',created:Date.now()});
    broadcast('delivery');notify(picks.length+' file reference(s) pushed to '+getItem(p).name+' / '+side.toUpperCase()+' bay. Recipient must accept.');
  }
  function setPane(side) {
    var id=state[side], p=getItem(id),frame=$(side+'Frame'),mode=state[side+'Mode'];
    if(!frame)return;
    var src = (mode==='embed') ? validUrl(urlFor(id)) : './platforms/'+p.id+'/index.html?bay='+side;
    if(!src) {notify('Invalid platform URL; restoring own workspace.');state[side+'Mode']='local';return setPane(side);}
    frame.src=src;$(side+'Title').textContent=p.name;
    $(side+'Foot').textContent=(mode==='embed')?'SITE FRAME: some sites reject iframe embedding; OPEN ↗ is the fallback.':'OWN PAGE: notes + shared browser vault inbox. External provider chats stay separate.';
    document.querySelectorAll('[data-side="'+side+'"][data-action]').forEach(function(b){b.classList.toggle('active',b.dataset.action===(mode==='embed'?'embed':'local'));});
    saveState();
  }
  function splitLayout() {
    var ratio=Number(state.ratio)||50,stage=$('stage');
    if(window.innerWidth>650){stage.style.gridTemplateColumns='minmax(0,'+ratio+'fr) 22px minmax(0,'+(100-ratio)+'fr)';}
    else stage.style.gridTemplateColumns='';
    stage.classList.toggle('forceTwo',!!state.forceTwo);
    $('ratioText').textContent=ratio+' / '+(100-ratio);
    $('split').value=ratio;$('layout').textContent=state.forceTwo?'2-UP ACTIVE':'FORCE 2-UP';
  }
  function populatePicker(side){
    var sel=$(side+'Platform');sel.innerHTML=ITEMS.map(function(p){return '<option value="'+p.id+'">'+escapeHtml(p.name)+'</option>';}).join('');sel.value=state[side];
    sel.addEventListener('change',function(){state[side]=sel.value;saveState();setPane(side);});
  }
  function setupConfig() {
    var rows=$('endpointRows');rows.innerHTML=ITEMS.map(function(p){return '<div class="endpoint"><label for="url-'+p.id+'">'+escapeHtml(p.name)+' · PLATFORM-BUILT PAGE</label><input id="url-'+p.id+'" data-provider-url="'+p.id+'" type="url" value="'+escapeHtml(urlFor(p.id))+'" spellcheck="false"></div>';}).join('');
    $('saveEndpoints').addEventListener('click',function(){
      var errors=[];document.querySelectorAll('[data-provider-url]').forEach(function(el){var v=validUrl(el.value.trim());if(!v)errors.push(el.dataset.providerUrl);else urls[el.dataset.providerUrl]=v;});
      if(errors.length){notify('Invalid URL for '+errors.join(', '));return;}
      localStorage.setItem(URL_KEY,JSON.stringify(urls));setPane('left');setPane('right');notify('Page wiring saved in this browser.');
    });
    $('relayUrl').value=localStorage.getItem(RELAY_KEY)||'';
    $('saveRelay').addEventListener('click',function(){var v=$('relayUrl').value.trim();if(v && !validUrl(v)){notify('Relay URL must start with http:// or https://');return;}localStorage.setItem(RELAY_KEY,v);notify(v?'Authorized relay address saved (not connected).':'Relay address cleared.');});
    $('checkRelay').addEventListener('click',async function(){
      var v=$('relayUrl').value.trim();if(!validUrl(v)){$('relayStatus').textContent='Enter a valid relay backend URL first.';return;}
      $('relayStatus').textContent='Checking relay endpoint...';
      try{var res=await fetch(v.replace(/\/+$/,'')+'/health',{mode:'cors',credentials:'include',signal:AbortSignal.timeout(9000)});if(!res.ok)throw Error('HTTP '+res.status);var payload=await res.json();$('relayStatus').textContent='Relay responding. OAuth connections are not verified by a health check. '+JSON.stringify(payload).slice(0,280);}
      catch(e){$('relayStatus').textContent='No accessible relay: '+e.message+' . Vault and internal handoffs still work.';}
    });
  }
  function initWire(){
    populatePicker('left');populatePicker('right');setPane('left');setPane('right');splitLayout();
    $('split').addEventListener('input',function(){state.ratio=Number(this.value);saveState();splitLayout();});
    window.addEventListener('resize',splitLayout);
    $('swap').addEventListener('click',function(){var t=state.left;state.left=state.right;state.right=t;var m=state.leftMode;state.leftMode=state.rightMode;state.rightMode=m;saveState();$('leftPlatform').value=state.left;$('rightPlatform').value=state.right;setPane('left');setPane('right');});
    $('layout').addEventListener('click',function(){state.forceTwo=!state.forceTwo;saveState();splitLayout();});
    document.querySelectorAll('[data-action][data-side]').forEach(function(b){
      b.addEventListener('click',function(){var side=b.dataset.side,act=b.dataset.action;
        if(act==='popout'){window.open(urlFor(state[side]),'_blank','noopener,noreferrer');return;}
        state[side+'Mode']=(act==='embed'?'embed':'local');setPane(side);
      });
    });
    $('vaultToggle').addEventListener('click',function(){state.rail=!state.rail;saveState();$('rail').hidden=!state.rail;});
    $('rail').hidden=!state.rail;
    $('uploadFiles').addEventListener('change',function(){addFiles(this.files);this.value='';});
    var drop=$('dropZone');
    ['dragenter','dragover'].forEach(function(e){drop.addEventListener(e,function(ev){ev.preventDefault();drop.classList.add('over');});});
    ['dragleave','drop'].forEach(function(e){drop.addEventListener(e,function(ev){ev.preventDefault();drop.classList.remove('over');});});
    drop.addEventListener('drop',function(e){if(e.dataTransfer.files.length)addFiles(e.dataTransfer.files);});
    $('pushLeft').addEventListener('click',function(){push('left').catch(function(e){notify(e.message);});});
    $('pushRight').addEventListener('click',function(){push('right').catch(function(e){notify(e.message);});});
    setupConfig();renderVault();
    if(bus) bus.onmessage=function(){renderVault();};
  }
  async function renderInbox(side,platform){
    var host=$('bayInbox');if(!host)return;
    try{
      var deliveries=(await storeAll('deliveries')).filter(function(d){return d.destSide===side&&d.platform===platform;}).sort(function(a,b){return b.created-a.created;});
      var files=await storeAll('files'),map={};files.forEach(function(f){map[f.id]=f;});
      host.innerHTML=deliveries.length?deliveries.map(function(d){
        var f=map[d.fileId];return '<div class="inboxRow"><div class="name">'+escapeHtml(f?f.name:'Missing local vault file')+'</div><div class="meta">'+escapeHtml(d.status.toUpperCase())+' · '+new Date(d.created).toLocaleString()+(f?' · '+formatBytes(f.size):'')+'</div><div class="inboxActions">'+(d.status==='pending'&&f?'<button data-accept="'+escapeHtml(d.id)+'">ACCEPT REFERENCE</button>':'')+(f?'<button data-bay-download="'+escapeHtml(f.id)+'">DOWNLOAD / UPLOAD EXTERNALLY</button>':'')+'</div></div>';
      }).join(''):'<p class="empty">No handoffs for this bay yet. Select a file in the Switchyard rail and push it here.</p>';
      host.querySelectorAll('[data-accept]').forEach(function(b){b.addEventListener('click',async function(){var d=await storeGet('deliveries',b.dataset.accept);if(!d)return;d.status='accepted';d.accepted=Date.now();await storePut('deliveries',d);broadcast('receipt');renderInbox(side,platform);notify('Handoff accepted in Switchyard inbox.');});});
      host.querySelectorAll('[data-bay-download]').forEach(function(b){b.addEventListener('click',function(){downloadFile(b.dataset.bayDownload);});});
    }catch(e){host.textContent='Inbox unavailable: '+e.message;}
  }
  function initBay(){
    var platform=document.body.dataset.platform||'custom', bay=(new URLSearchParams(location.search)).get('bay')||'standalone',p=getItem(platform);
    document.documentElement.style.setProperty('--accent',p.accent);
    $('bayTitle').textContent=p.name;$('baySubtitle').textContent=bay==='standalone'?'STANDALONE MODULE':'WIRED TO '+bay.toUpperCase()+' BAY';
    $('launchExternal').href=urlFor(platform);
    var key='lokivelli.bay.notes.'+platform+'.'+bay;
    $('notes').value=localStorage.getItem(key)||'';
    $('notes').addEventListener('input',function(){localStorage.setItem(key,this.value);$('saved').textContent='SAVED LOCALLY · '+new Date().toLocaleTimeString();});
    $('refreshInbox').addEventListener('click',function(){renderInbox(bay,platform);});
    $('externalStatus').textContent='Opening '+p.name+' uses that provider\'s own login. This page cannot read its private chat or inject attachments.';
    renderInbox(bay,platform);
    if(bus)bus.onmessage=function(e){if(e.data.event==='delivery'||e.data.event==='vault')renderInbox(bay,platform);};
    window.addEventListener('focus',function(){renderInbox(bay,platform);});
  }
  if(document.body.dataset.view==='switchyard')initWire();
  if(document.body.dataset.view==='bay')initBay();
})();