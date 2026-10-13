(() => {
'use strict';

/* ---------- login ---------- */
const LOGIN_USERNAME = 'luke';
const LOGIN_PASSWORD_SHA256 = '23f26c1f19c8ef676e496b4021c12831ecbd11c4ba400b516dda4badf653d71c';
const LOGIN_SESSION_KEY = 'chinon-v10-auth';

async function sha256Hex(value){
  const bytes = new TextEncoder().encode(String(value ?? ''));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function unlock(){
  document.body.classList.remove('auth-locked');
  document.querySelector('#loginGate')?.classList.add('hidden');
}
async function initLogin(){
  if(sessionStorage.getItem(LOGIN_SESSION_KEY)==='ok'){ unlock(); return; }
  const form=document.querySelector('#loginForm');
  const user=document.querySelector('#loginUser');
  const pass=document.querySelector('#loginPass');
  const err=document.querySelector('#loginError');
  const toggle=document.querySelector('#togglePassword');

  // V10.1：避免瀏覽器密碼管理器／舊 autofill 把帳號欄鎖住或塞入異常字串。
  [user,pass].forEach(input=>{
    input.disabled=false;
    input.readOnly=false;
    input.removeAttribute('disabled');
    input.removeAttribute('readonly');
  });
  user.value='luke';
  pass.value='';
  setTimeout(()=>{
    user.disabled=false;
    user.readOnly=false;
    pass.disabled=false;
    pass.readOnly=false;
  },50);
  // login card focus helper
  user.addEventListener('click',()=>user.focus());
  pass.addEventListener('click',()=>pass.focus());

  toggle.addEventListener('click',()=>{
    const show=pass.type==='password';
    pass.type=show?'text':'password';
    toggle.textContent=show?'隱藏':'顯示';
  });
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const ok=user.value.trim()===LOGIN_USERNAME && await sha256Hex(pass.value)===LOGIN_PASSWORD_SHA256;
    if(ok){ sessionStorage.setItem(LOGIN_SESSION_KEY,'ok'); err.textContent=''; unlock(); pass.value=''; }
    else{ err.textContent='帳號或密碼錯誤。'; pass.value=''; pass.focus(); }
  });
}
initLogin();

/* ---------- config ---------- */
const $ = s => document.querySelector(s);
const SITE_PAGES = [
  {file:'index.html',name:'首頁'},
  {file:'about.html',name:'關於奇農'},
  {file:'craft.html',name:'製茶堅持'},
  {file:'gaba.html',name:'GABA桑茶'},
  {file:'maca.html',name:'秘魯瑪卡'},
  {file:'certificates.html',name:'檢測證書'},
  {file:'info.html',name:'相關資訊'},
  {file:'contact.html',name:'聯繫我們'}
];
const SITE_FILES = new Set(SITE_PAGES.map(x=>x.file));
const iframe = $('#siteFrame');
const frameBox = $('#canvasFrame');
const statusEl = $('#status');
const DRAFT_DB = 'chinon-v10-editor';
const DRAFT_STORE = 'state';
const DRAFT_KEY = 'draft-v10';
const PREVIEW_SNAPSHOT_KEY = 'preview-snapshot-v10';
const PUBLISH_SETTINGS_KEY = 'chinon-v10-publish-settings';
const TOKEN_SESSION_KEY = 'chinon-v10-token';
const TOKEN_LOCAL_KEY = 'chinon-v10-token-local';

let currentFile = 'index.html';
let currentBaseHash = '';
let currentLiveSource = '';
let selected = null;
let currentDirty = false;
let dragState = null;
let resizeState = null;
let pageDrafts = new Map();
let undoStack = [];
let redoStack = [];
let latestPreviewUrl = '';
let latestPreviewCommit = '';
let latestPreviewId = '';

const EDITOR_STYLE_ID = 'chinon-v10-editor-style';
const HANDLE_ID = 'chinon-v10-resize-handle';
const SELECT_ATTR = 'data-chinon-v10-selected';
const ADDED_ATTR = 'data-chinon-v10-added';
const FLOAT_ATTR = 'data-chinon-v10-float';
const PLACEHOLDER_ATTR = 'data-chinon-v10-placeholder';
const INTERNAL_ATTRS = [SELECT_ATTR,'data-chinon-v10-editing'];

function setStatus(msg){ statusEl.textContent=msg; }

/* ---------- IndexedDB ---------- */
function openDb(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DRAFT_DB,1);
    req.onupgradeneeded=()=>{ if(!req.result.objectStoreNames.contains(DRAFT_STORE)) req.result.createObjectStore(DRAFT_STORE); };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
async function dbGet(key){
  const db=await openDb();
  try{
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction(DRAFT_STORE,'readonly');
      const req=tx.objectStore(DRAFT_STORE).get(key);
      req.onsuccess=()=>resolve(req.result||null);
      req.onerror=()=>reject(req.error);
    });
  }finally{ db.close(); }
}
async function dbPut(key,value){
  const db=await openDb();
  try{
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(DRAFT_STORE,'readwrite');
      tx.objectStore(DRAFT_STORE).put(value,key);
      tx.oncomplete=resolve;
      tx.onerror=()=>reject(tx.error);
    });
  }finally{ db.close(); }
}
async function saveDraftState(){
  captureCurrentPage();
  const payload={pages:[...pageDrafts.entries()],savedAt:Date.now()};
  await dbPut(DRAFT_KEY,payload);
  setStatus('草稿已儲存在這台電腦。正式網站沒有變更。');
}
async function restoreDraftState(){
  const saved=await dbGet(DRAFT_KEY);
  if(saved?.pages) pageDrafts=new Map(saved.pages);
}

/* ---------- helpers ---------- */
async function hashText(text){ return sha256Hex(text); }
async function fetchLive(file){
  const res=await fetch(`../${file}?v10=${Date.now()}`,{cache:'no-store'});
  if(!res.ok) throw new Error(`${file} 讀取失敗 (${res.status})`);
  return await res.text();
}
function isTextElement(el){
  if(!el) return false;
  return ['H1','H2','H3','H4','H5','H6','P','SPAN','A','BUTTON','LI','STRONG','EM','SMALL','LABEL','FIGCAPTION','TD','TH'].includes(el.tagName);
}
function cleanDocumentHtml(doc){
  const clone=doc.documentElement.cloneNode(true);
  clone.querySelector(`#${EDITOR_STYLE_ID}`)?.remove();
  clone.querySelector(`#${HANDLE_ID}`)?.remove();
  clone.querySelectorAll(`[${SELECT_ATTR}]`).forEach(el=>el.removeAttribute(SELECT_ATTR));
  clone.querySelectorAll('[contenteditable]').forEach(el=>el.removeAttribute('contenteditable'));
  clone.querySelectorAll('[data-chinon-v10-editing]').forEach(el=>el.removeAttribute('data-chinon-v10-editing'));
  clone.querySelector('base[data-chinon-v10-base]')?.remove();
  return '<!doctype html>\n'+clone.outerHTML;
}
function toEditorSrcdoc(html){
  const doc=new DOMParser().parseFromString(html,'text/html');
  let base=doc.head.querySelector('base[data-chinon-v10-base]');
  if(!base){
    base=doc.createElement('base');
    base.setAttribute('data-chinon-v10-base','1');
    doc.head.prepend(base);
  }
  base.href='/';
  return '<!doctype html>\n'+doc.documentElement.outerHTML;
}
function captureCurrentPage(){
  const doc=iframe.contentDocument;
  if(!doc?.documentElement || !currentFile) return;
  const html=cleanDocumentHtml(doc);
  pageDrafts.set(currentFile,{html,baseHash:currentBaseHash,dirty:currentDirty});
}
function markDirty(){
  currentDirty=true;
  const draft=pageDrafts.get(currentFile);
  if(draft) draft.dirty=true;
  $('#btnPromote').disabled=true;
  latestPreviewCommit='';
  setStatus('有尚未發布的修改。先「① 發布測試版」查看實際結果。');
}
function pushUndo(){
  const doc=iframe.contentDocument;
  if(!doc) return;
  undoStack.push(cleanDocumentHtml(doc));
  if(undoStack.length>30) undoStack.shift();
  redoStack=[];
}
function applySnapshot(html){
  iframe.srcdoc=toEditorSrcdoc(html);
}
function undo(){
  if(!undoStack.length) return;
  const current=cleanDocumentHtml(iframe.contentDocument);
  redoStack.push(current);
  applySnapshot(undoStack.pop());
  markDirty();
}
function redo(){
  if(!redoStack.length) return;
  const current=cleanDocumentHtml(iframe.contentDocument);
  undoStack.push(current);
  applySnapshot(redoStack.pop());
  markDirty();
}

/* ---------- load pages ---------- */
async function loadPage(file,{forceLive=false}={}){
  if(currentFile && iframe.contentDocument?.documentElement) captureCurrentPage();

  currentFile=file;
  $('#pageSelect').value=file;
  selected=null;
  $('#selectedLabel').textContent='尚未選取';
  undoStack=[]; redoStack=[];
  setStatus(`正在載入 ${SITE_PAGES.find(x=>x.file===file)?.name||file}…`);

  const live=await fetchLive(file);
  currentLiveSource=live;
  currentBaseHash=await hashText(live);

  const draft=pageDrafts.get(file);
  if(!forceLive && draft?.html && draft.baseHash===currentBaseHash){
    currentDirty=!!draft.dirty;
    iframe.srcdoc=toEditorSrcdoc(draft.html);
  }else{
    if(draft && draft.baseHash!==currentBaseHash) pageDrafts.delete(file);
    currentDirty=false;
    iframe.removeAttribute('srcdoc');
    iframe.src=`../${file}?editorV10=${Date.now()}`;
  }
}
async function reloadCurrentFromLive(){
  if(!confirm('這會捨棄目前這一頁尚未發布的草稿，重新抓正式網站。確定？')) return;
  pageDrafts.delete(currentFile);
  currentDirty=false;
  await loadPage(currentFile,{forceLive:true});
  await saveDraftState();
}

/* ---------- iframe editor ---------- */
function injectEditorUi(doc){
  doc.getElementById(EDITOR_STYLE_ID)?.remove();
  const style=doc.createElement('style');
  style.id=EDITOR_STYLE_ID;
  style.textContent=`
    [${SELECT_ATTR}="1"]{outline:2px solid #7c5cff!important;outline-offset:2px!important}
    [data-chinon-v10-editing="1"]{outline:2px dashed #11a36a!important}
    #${HANDLE_ID}{
      position:absolute;width:14px;height:14px;border-radius:4px;background:#7c5cff;
      border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35);
      z-index:2147483647;cursor:nwse-resize;display:none
    }
    [${FLOAT_ATTR}="1"]{cursor:move!important}
  `;
  doc.head.appendChild(style);

  let handle=doc.getElementById(HANDLE_ID);
  if(!handle){
    handle=doc.createElement('div');
    handle.id=HANDLE_ID;
    doc.body.appendChild(handle);
  }
  handle.addEventListener('pointerdown',startResize);

  doc.addEventListener('click',e=>{
    if(e.target.id===HANDLE_ID) return;
    if(e.target.closest('a')) e.preventDefault();
    e.stopPropagation();
    selectElement(e.target);
  },true);

  doc.addEventListener('dblclick',e=>{
    const el=e.target;
    if(!isTextElement(el)) return;
    e.preventDefault(); e.stopPropagation();
    pushUndo();
    selectElement(el);
    el.contentEditable='true';
    el.setAttribute('data-chinon-v10-editing','1');
    el.focus();
    const finish=()=>{
      el.contentEditable='false';
      el.removeAttribute('data-chinon-v10-editing');
      markDirty();
      el.removeEventListener('blur',finish);
    };
    el.addEventListener('blur',finish);
  },true);

  doc.addEventListener('input',e=>{
    if(e.target?.isContentEditable) markDirty();
  },true);

  doc.addEventListener('pointerdown',e=>{
    const el=e.target.closest?.(`[${FLOAT_ATTR}="1"]`);
    if(!el || e.target.id===HANDLE_ID) return;
    startFloatDrag(e,el);
  },true);

  doc.defaultView.addEventListener('scroll',updateHandle,{passive:true});
  doc.defaultView.addEventListener('resize',updateHandle);
}
function selectElement(el){
  if(!el || el===iframe.contentDocument?.body || el===iframe.contentDocument?.documentElement) return;
  if(selected) selected.removeAttribute(SELECT_ATTR);
  selected=el;
  selected.setAttribute(SELECT_ATTR,'1');
  $('#selectedLabel').textContent=`${el.tagName.toLowerCase()}${el.id?'#'+el.id:''}${el.classList.length?'.'+[...el.classList].slice(0,2).join('.'):''}`;
  syncInspector();
  updateHandle();
}
function updateHandle(){
  const doc=iframe.contentDocument;
  const handle=doc?.getElementById(HANDLE_ID);
  if(!handle || !selected || !selected.isConnected){ if(handle) handle.style.display='none'; return; }
  const r=selected.getBoundingClientRect();
  handle.style.display='block';
  handle.style.left=`${r.right + doc.defaultView.scrollX - 7}px`;
  handle.style.top=`${r.bottom + doc.defaultView.scrollY - 7}px`;
}
function syncInspector(){
  if(!selected) return;
  const cs=iframe.contentWindow.getComputedStyle(selected);
  const mappings=[
    ['fontFamily','fontFamily'],['fontSize','fontSize'],['fontWeight','fontWeight'],
    ['textAlign','textAlign'],['lineHeight','lineHeight'],['letterSpacing','letterSpacing'],
    ['widthCtl','width'],['marginTop','marginTop'],['marginBottom','marginBottom'],
    ['paddingTop','paddingTop'],['paddingBottom','paddingBottom'],['objectFit','objectFit'],
    ['objectPosition','objectPosition'],['backgroundPosition','backgroundPosition'],
    ['backgroundSize','backgroundSize'],['borderRadius','borderRadius'],['boxShadow','boxShadow'],
    ['textShadow','textShadow']
  ];
  mappings.forEach(([id,prop])=>{
    const ctl=$('#'+id); if(!ctl) return;
    const val=selected.style[prop]||'';
    [...ctl.options].some(o=>o.value===val) ? ctl.value=val : ctl.value='';
  });
  try{
    $('#textColor').value=rgbToHex(cs.color);
    $('#backgroundColor').value=cs.backgroundColor==='rgba(0, 0, 0, 0)'?'#ffffff':rgbToHex(cs.backgroundColor);
  }catch{}
  $('#linkUrl').value=selected.closest('a')?.getAttribute('href')||'';
}
function rgbToHex(rgb){
  const m=String(rgb).match(/\d+/g);
  if(!m||m.length<3) return '#222222';
  return '#'+m.slice(0,3).map(x=>(+x).toString(16).padStart(2,'0')).join('');
}
function applyStyle(prop,value){
  if(!selected || value==='') return;
  pushUndo();
  selected.style[prop]=value;
  markDirty();
  updateHandle();
}
function bindSelect(id,prop){ $('#'+id).addEventListener('change',e=>applyStyle(prop,e.target.value)); }

/* ---------- resize ---------- */
function startResize(e){
  if(!selected) return;
  e.preventDefault(); e.stopPropagation();
  pushUndo();
  const r=selected.getBoundingClientRect();
  const cs=iframe.contentWindow.getComputedStyle(selected);
  resizeState={
    startX:e.clientX,startW:r.width,startH:r.height,
    startFont:parseFloat(cs.fontSize)||16,
    isText:isTextElement(selected),isImage:selected.tagName==='IMG'
  };
  const doc=iframe.contentDocument;
  doc.addEventListener('pointermove',onResizeMove,true);
  doc.addEventListener('pointerup',endResize,{once:true,capture:true});
}
function onResizeMove(e){
  if(!resizeState||!selected) return;
  const dx=e.clientX-resizeState.startX;
  const newW=Math.max(30,resizeState.startW+dx);
  if(resizeState.isText){
    const scale=newW/Math.max(1,resizeState.startW);
    selected.style.fontSize=`${Math.max(8,resizeState.startFont*scale).toFixed(1)}px`;
  }else{
    selected.style.width=`${newW.toFixed(0)}px`;
    if(resizeState.isImage) selected.style.height='auto';
  }
  updateHandle();
}
function endResize(){
  const doc=iframe.contentDocument;
  doc.removeEventListener('pointermove',onResizeMove,true);
  resizeState=null; markDirty();
}

/* ---------- images ---------- */
function fileToDataUrl(file){
  return new Promise((resolve,reject)=>{
    const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(file);
  });
}
function findInsertContainer(){
  if(!selected) return iframe.contentDocument.body;
  return selected.closest('section,header,footer,main,article,.container,div') || selected.parentElement || iframe.contentDocument.body;
}
async function addImage(file){
  if(!file) return;
  pushUndo();
  const src=await fileToDataUrl(file);
  const doc=iframe.contentDocument;
  const img=doc.createElement('img');
  img.src=src;
  img.alt='';
  img.setAttribute(ADDED_ATTR,'1');
  img.style.cssText='display:block;width:min(320px,90%);height:auto;margin:24px auto;object-fit:contain;';
  const container=findInsertContainer();
  if(selected && selected.parentElement===container) selected.insertAdjacentElement('afterend',img);
  else container.appendChild(img);
  selectElement(img); markDirty();
  img.scrollIntoView({block:'center',behavior:'smooth'});
}
async function replaceImage(file){
  if(!file || !selected || selected.tagName!=='IMG'){ alert('請先點選要更換的圖片。'); return; }
  pushUndo(); selected.src=await fileToDataUrl(file); markDirty(); updateHandle();
}
async function setBackground(file){
  if(!file || !selected){ alert('請先點選要設定背景的區塊。'); return; }
  pushUndo(); const src=await fileToDataUrl(file);
  selected.style.backgroundImage=`url("${src}")`;
  if(!selected.style.backgroundPosition) selected.style.backgroundPosition='center center';
  if(!selected.style.backgroundSize) selected.style.backgroundSize='cover';
  selected.style.backgroundRepeat='no-repeat';
  markDirty();
}
function alignImage(mode){
  if(!selected || selected.tagName!=='IMG'){ alert('請先點選圖片。'); return; }
  pushUndo();
  selected.style.display='block';
  if(mode==='left'){ selected.style.marginLeft='0'; selected.style.marginRight='auto'; }
  if(mode==='center'){ selected.style.marginLeft='auto'; selected.style.marginRight='auto'; }
  if(mode==='right'){ selected.style.marginLeft='auto'; selected.style.marginRight='0'; }
  selected.style.objectPosition='center center';
  markDirty();
}

/* ---------- float drag ---------- */
function floatSelected(){
  if(!selected){ alert('請先選取圖片或物件。'); return; }
  if(selected.hasAttribute(FLOAT_ATTR)) return;
  pushUndo();
  const doc=iframe.contentDocument;
  const parent=selected.parentElement;
  if(!parent) return;
  const r=selected.getBoundingClientRect(), pr=parent.getBoundingClientRect();
  const id='float-'+Date.now().toString(36);
  const ph=doc.createElement(selected.tagName==='IMG'?'span':'div');
  ph.setAttribute(PLACEHOLDER_ATTR,id);
  ph.style.display=iframe.contentWindow.getComputedStyle(selected).display==='inline'?'inline-block':'block';
  ph.style.width=`${r.width}px`; ph.style.height=`${r.height}px`; ph.style.visibility='hidden';
  selected.insertAdjacentElement('beforebegin',ph);

  if(iframe.contentWindow.getComputedStyle(parent).position==='static') parent.style.position='relative';
  selected.setAttribute(FLOAT_ATTR,id);
  selected.style.position='absolute';
  selected.style.left=`${r.left-pr.left+parent.scrollLeft}px`;
  selected.style.top=`${r.top-pr.top+parent.scrollTop}px`;
  selected.style.width=`${r.width}px`;
  selected.style.height=`${r.height}px`;
  selected.style.margin='0';
  selected.style.zIndex='20';
  markDirty(); updateHandle();
}
function unfloatSelected(){
  if(!selected || !selected.hasAttribute(FLOAT_ATTR)){ alert('目前選取物件不是自由擺放物件。'); return; }
  pushUndo();
  const id=selected.getAttribute(FLOAT_ATTR);
  const doc=iframe.contentDocument;
  doc.querySelector(`[${PLACEHOLDER_ATTR}="${CSS.escape(id)}"]`)?.remove();
  selected.removeAttribute(FLOAT_ATTR);
  ['position','left','top','zIndex','margin','height'].forEach(p=>selected.style[p]='');
  markDirty(); updateHandle();
}
function startFloatDrag(e,el){
  e.preventDefault(); e.stopPropagation();
  selectElement(el); pushUndo();
  const left=parseFloat(el.style.left)||0, top=parseFloat(el.style.top)||0;
  dragState={el,startX:e.clientX,startY:e.clientY,left,top};
  const doc=iframe.contentDocument;
  doc.addEventListener('pointermove',onFloatMove,true);
  doc.addEventListener('pointerup',endFloatDrag,{once:true,capture:true});
}
function onFloatMove(e){
  if(!dragState) return;
  dragState.el.style.left=`${dragState.left+(e.clientX-dragState.startX)}px`;
  dragState.el.style.top=`${dragState.top+(e.clientY-dragState.startY)}px`;
  updateHandle();
}
function endFloatDrag(){
  iframe.contentDocument.removeEventListener('pointermove',onFloatMove,true);
  dragState=null; markDirty();
}
function deleteAdded(){
  if(!selected || !selected.hasAttribute(ADDED_ATTR)){ alert('為避免誤刪官網原本結構，這裡只能刪除你在 V10 新增的物件。'); return; }
  if(!confirm('刪除這個新增物件？')) return;
  pushUndo();
  const id=selected.getAttribute(FLOAT_ATTR);
  if(id) iframe.contentDocument.querySelector(`[${PLACEHOLDER_ATTR}="${CSS.escape(id)}"]`)?.remove();
  const next=selected.parentElement; selected.remove(); selected=null;
  $('#selectedLabel').textContent='尚未選取'; markDirty();
}

/* ---------- link ---------- */
function applyLink(){
  if(!selected) return;
  const url=$('#linkUrl').value.trim();
  if(!url) return;
  pushUndo();
  if(selected.tagName==='A') selected.setAttribute('href',url);
  else{
    const doc=iframe.contentDocument;
    const a=doc.createElement('a'); a.href=url;
    selected.replaceWith(a); a.appendChild(selected); selected=a;
  }
  markDirty();
}

/* ---------- publish snapshot ---------- */
function extFromMime(mime){
  if(mime.includes('png')) return 'png';
  if(mime.includes('webp')) return 'webp';
  if(mime.includes('gif')) return 'gif';
  if(mime.includes('svg')) return 'svg';
  return 'jpg';
}
function bytesToBase64(bytes){
  let s=''; const chunk=0x8000;
  for(let i=0;i<bytes.length;i+=chunk) s+=String.fromCharCode(...bytes.subarray(i,i+chunk));
  return btoa(s);
}
async function dataUrlToAsset(dataUrl){
  const res=await fetch(dataUrl); const blob=await res.blob();
  return {ext:extFromMime(blob.type||''),base64:bytesToBase64(new Uint8Array(await blob.arrayBuffer()))};
}
async function replaceDataUrls(doc,assetFiles,state){
  const imgs=[...doc.querySelectorAll('img[src^="data:"]')];
  for(const img of imgs){
    const a=await dataUrlToAsset(img.getAttribute('src'));
    const path=`assets/uploads/v10-${state.id}-${state.n++}.${a.ext}`;
    assetFiles.set(path,{content:a.base64,encoding:'base64'});
    img.setAttribute('src',path);
  }
  const styled=[...doc.querySelectorAll('[style*="data:"]')];
  const rx=/url\(\s*(['"]?)(data:[^)'"]+)\1\s*\)/ig;
  for(const el of styled){
    let st=el.getAttribute('style')||''; const matches=[...st.matchAll(rx)];
    for(const m of matches){
      const a=await dataUrlToAsset(m[2]);
      const path=`assets/uploads/v10-${state.id}-${state.n++}.${a.ext}`;
      assetFiles.set(path,{content:a.base64,encoding:'base64'});
      st=st.replace(m[2],path);
    }
    el.setAttribute('style',st);
  }
}
function stripEditorArtifacts(doc){
  doc.getElementById(EDITOR_STYLE_ID)?.remove();
  doc.getElementById(HANDLE_ID)?.remove();
  doc.querySelector('base[data-chinon-v10-base]')?.remove();
  doc.querySelectorAll(`[${SELECT_ATTR}]`).forEach(el=>el.removeAttribute(SELECT_ATTR));
  doc.querySelectorAll('[contenteditable]').forEach(el=>el.removeAttribute('contenteditable'));
  doc.querySelectorAll('[data-chinon-v10-editing]').forEach(el=>el.removeAttribute('data-chinon-v10-editing'));
}
function serializeDoc(doc){ return '<!doctype html>\n'+doc.documentElement.outerHTML; }
function rewritePreviewPaths(doc){
  const pageNames=new Set(SITE_PAGES.map(x=>x.file));
  doc.querySelectorAll('a[href]').forEach(a=>{
    const href=a.getAttribute('href')||'';
    if(pageNames.has(href)) a.setAttribute('href',`/preview/${href}`);
    else if(href.startsWith('./') && pageNames.has(href.slice(2))) a.setAttribute('href',`/preview/${href.slice(2)}`);
  });
  const attrs=[['img','src'],['source','src'],['video','poster'],['script','src'],['link','href']];
  attrs.forEach(([sel,attr])=>{
    doc.querySelectorAll(`${sel}[${attr}]`).forEach(el=>{
      const v=el.getAttribute(attr)||'';
      if(/^assets\//.test(v)||v==='styles.css'||v==='main.js') el.setAttribute(attr,'/'+v);
      if(/^\.\/assets\//.test(v)) el.setAttribute(attr,'/'+v.slice(2));
    });
  });
  doc.querySelectorAll('[style]').forEach(el=>{
    const st=el.getAttribute('style')||'';
    el.setAttribute('style',st.replace(/url\((['"]?)(assets\/)/g,'url($1/$2'));
  });
}
async function buildPreviewSnapshot(){
  captureCurrentPage();
  const previewFiles=new Map();
  const productionFiles=new Map();
  const assetFiles=new Map();
  const assetState={id:Date.now().toString(36),n:1};
  const dirtyFiles=[];

  for(const page of SITE_PAGES){
    const fresh=await fetchLive(page.file);
    const freshHash=await hashText(fresh);
    const draft=pageDrafts.get(page.file);
    let source=fresh;
    let dirty=false;

    if(draft?.dirty){
      if(draft.baseHash!==freshHash){
        throw new Error(`${page.name} 的正式網站在你編輯期間已更新。為避免覆蓋新版，請先重新載入官網。`);
      }
      source=draft.html; dirty=true; dirtyFiles.push(page.file);
    }

    const prodDoc=new DOMParser().parseFromString(source,'text/html');
    stripEditorArtifacts(prodDoc);
    await replaceDataUrls(prodDoc,assetFiles,assetState);
    const prodHtml=serializeDoc(prodDoc);

    const previewDoc=new DOMParser().parseFromString(prodHtml,'text/html');
    rewritePreviewPaths(previewDoc);
    let marker=previewDoc.head.querySelector('meta[name="chinon-preview-id"]');
    if(!marker){
      marker=previewDoc.createElement('meta');
      marker.name='chinon-preview-id';
      previewDoc.head.appendChild(marker);
    }
    marker.content=assetState.id;
    const previewHtml=serializeDoc(previewDoc);

    previewFiles.set(`preview/${page.file}`,{content:previewHtml,encoding:'utf-8'});
    if(dirty) productionFiles.set(page.file,{content:prodHtml,encoding:'utf-8'});
  }
  for(const [path,file] of assetFiles) previewFiles.set(path,file);

  return {
    createdAt:Date.now(),
    previewId:assetState.id,
    dirtyFiles,
    previewFiles:[...previewFiles.entries()],
    productionFiles:[...productionFiles.entries()],
    assetPaths:[...assetFiles.keys()]
  };
}


/* ---------- GitHub Pages preview readiness ---------- */
async function checkPreviewReady(previewId){
  if(!previewId) return false;
  try{
    const url=`${location.origin}/preview/index.html?deployCheck=${Date.now()}`;
    const res=await fetch(url,{cache:'no-store'});
    if(!res.ok) return false;
    const text=await res.text();
    return text.includes(`name="chinon-preview-id" content="${previewId}"`) ||
           text.includes(`content="${previewId}" name="chinon-preview-id"`);
  }catch{
    return false;
  }
}
async function waitForPreviewReady(previewId,{timeoutMs=120000,intervalMs=3000}={}){
  const start=Date.now();
  let attempt=0;
  while(Date.now()-start < timeoutMs){
    attempt++;
    const sec=Math.round((Date.now()-start)/1000);
    publishProgress(`測試版已送到 GitHub。\n正在等待 GitHub Pages 部署完成… ${sec} 秒\n\n這段期間正式網站完全不會變更。`);
    if(await checkPreviewReady(previewId)) return true;
    await new Promise(r=>setTimeout(r,intervalMs));
  }
  return false;
}
async function verifyPreviewNow(){
  if(!latestPreviewId){
    const snap=await dbGet(PREVIEW_SNAPSHOT_KEY);
    latestPreviewId=snap?.previewId||'';
  }
  if(!latestPreviewId){
    alert('目前沒有可檢查的測試版，請先按「① 發布測試版」。');
    return false;
  }
  $('#btnCheckPreview').disabled=true;
  setStatus('正在檢查 GitHub Pages 測試版是否已部署…');
  const ok=await checkPreviewReady(latestPreviewId);
  $('#btnCheckPreview').disabled=false;
  if(ok){
    $('#btnOpenPreview').disabled=false;
    const snap=await dbGet(PREVIEW_SNAPSHOT_KEY);
    $('#btnPromote').disabled=!(snap?.dirtyFiles?.length);
    setStatus('測試版部署完成，可以開啟檢查。正式網站尚未變更。');
  }else{
    $('#btnOpenPreview').disabled=true;
    $('#btnPromote').disabled=true;
    setStatus('測試版尚未部署完成。再等約 20～60 秒後按「檢查測試版部署」。');
    alert('GitHub Pages 還沒有部署到這次測試版。\n\n再等 20～60 秒，然後按「檢查測試版部署」。\n正式網站沒有被修改。');
  }
  return ok;
}

/* ---------- GitHub API ---------- */
function publishProgress(msg,type=''){
  const el=$('#publishProgress'); el.textContent=msg; el.className='publish-progress'+(type?' '+type:'');
}
function loadPublishSettings(){
  let s={}; try{s=JSON.parse(localStorage.getItem(PUBLISH_SETTINGS_KEY)||'{}')}catch{}
  $('#publishOwner').value=s.owner||'TSRCBC';
  $('#publishRepo').value=s.repo||'TSRCBC.github.io';
  $('#publishBranch').value=s.branch||'main';
  const localToken=localStorage.getItem(TOKEN_LOCAL_KEY)||'';
  const sessionToken=sessionStorage.getItem(TOKEN_SESSION_KEY)||'';
  $('#publishToken').value=localToken||sessionToken;
  $('#rememberToken').checked=!!localToken;
}
function savePublishSettings(){
  const owner=$('#publishOwner').value.trim(), repo=$('#publishRepo').value.trim(), branch=$('#publishBranch').value.trim()||'main';
  const token=$('#publishToken').value.trim(), remember=$('#rememberToken').checked;
  localStorage.setItem(PUBLISH_SETTINGS_KEY,JSON.stringify({owner,repo,branch}));
  if(token){
    if(remember){ localStorage.setItem(TOKEN_LOCAL_KEY,token); sessionStorage.removeItem(TOKEN_SESSION_KEY); }
    else{ sessionStorage.setItem(TOKEN_SESSION_KEY,token); localStorage.removeItem(TOKEN_LOCAL_KEY); }
  }
  return {owner,repo,branch,token};
}
async function githubApi(url,token,options={}){
  const res=await fetch(url,{
    ...options,
    headers:{
      Accept:'application/vnd.github+json',
      'X-GitHub-Api-Version':'2022-11-28',
      Authorization:`Bearer ${token}`,
      ...(options.headers||{})
    }
  });
  if(!res.ok){
    let detail=''; try{detail=(await res.json())?.message||''}catch{}
    if(res.status===401) throw new Error('GitHub Token 無效或已過期。');
    if(res.status===403) throw new Error('GitHub Token 沒有 Contents Read and write 權限。');
    throw new Error(`GitHub API ${res.status}：${detail}`);
  }
  return res.status===204?null:res.json();
}
async function createBlob(owner,repo,token,file){
  return githubApi(`https://api.github.com/repos/${owner}/${repo}/git/blobs`,token,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({content:file.content,encoding:file.encoding==='base64'?'base64':'utf-8'})
  });
}
async function commitFiles({owner,repo,branch,token,files,message,expectedHead=null}){
  const ref=await githubApi(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`,token);
  const parentSha=ref.object.sha;
  if(expectedHead && parentSha!==expectedHead) throw new Error('GitHub 在你確認測試版之後又有新的 Commit。為避免覆蓋別的更新，正式套用已停止，請重新發布測試版。');
  const parent=await githubApi(`https://api.github.com/repos/${owner}/${repo}/git/commits/${parentSha}`,token);
  const entries=[]; let done=0;
  for(const [path,file] of files){
    const blob=await createBlob(owner,repo,token,file);
    entries.push({path,mode:'100644',type:'blob',sha:blob.sha});
    done++; publishProgress(`正在上傳 ${done}/${files.length}：${path}`);
  }
  const tree=await githubApi(`https://api.github.com/repos/${owner}/${repo}/git/trees`,token,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({base_tree:parent.tree.sha,tree:entries})
  });
  const commit=await githubApi(`https://api.github.com/repos/${owner}/${repo}/git/commits`,token,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({message,tree:tree.sha,parents:[parentSha]})
  });
  await githubApi(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,token,{
    method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({sha:commit.sha,force:false})
  });
  return commit.sha;
}

let publishMode='preview';
function openPublish(mode){
  publishMode=mode; loadPublishSettings();
  $('#publishTitle').textContent=mode==='preview'?'發布測試版':'套用正式網站';
  $('#publishIntro').textContent=mode==='preview'
    ? '這一步只更新 /preview/ 測試站，不會改正式首頁。'
    : '這一步只會使用你剛剛已確認的測試版快照，套用到正式網站。';
  $('#btnDoPublish').textContent=mode==='preview'?'發布測試版':'套用正式網站';
  publishProgress(mode==='preview'?'正式網站不會在這一步變更。':'請先確認測試版看起來完全正確。');
  $('#publishDialog').showModal();
}
async function doPublish(){
  const btn=$('#btnDoPublish');
  const settings=savePublishSettings();
  if(!settings.owner||!settings.repo||!settings.branch||!settings.token){ publishProgress('請完整填寫 GitHub 發布資料。','error'); return; }
  btn.disabled=true;
  try{
    if(publishMode==='preview'){
      publishProgress('正在建立與目前畫面相同的測試快照…');
      const snap=await buildPreviewSnapshot();
      const files=snap.previewFiles;
      const sha=await commitFiles({
        ...settings,files,
        message:`Preview CHINON V10 ${new Date().toLocaleString('zh-TW')}`
      });
      snap.previewCommitSha=sha;
      await dbPut(PREVIEW_SNAPSHOT_KEY,snap);
      latestPreviewCommit=sha;
      latestPreviewId=snap.previewId;
      latestPreviewUrl=`${location.origin}/preview/index.html?v=${Date.now()}`;
      $('#btnCheckPreview').disabled=false;
      $('#btnOpenPreview').disabled=true;
      $('#btnPromote').disabled=true;

      const ready=await waitForPreviewReady(snap.previewId);
      if(ready){
        $('#btnOpenPreview').disabled=false;
        $('#btnPromote').disabled=snap.dirtyFiles.length===0;
        publishProgress(`測試版部署完成！\n變更頁面：${snap.dirtyFiles.join('、')||'無'}\nCommit：${sha.slice(0,7)}\n\n現在可以按「② 開啟測試版」檢查。`,'ok');
        setStatus('測試版已部署完成。正式網站尚未變更。');
      }else{
        publishProgress(`GitHub Commit 已成功，但 GitHub Pages 兩分鐘內仍未完成部署。\nCommit：${sha.slice(0,7)}\n\n請稍後按「檢查測試版部署」。正式網站沒有被修改。`,'error');
        setStatus('GitHub 已收到測試版，但 Pages 尚未部署完成。正式網站沒有變更。');
      }
    }else{
      const snap=await dbGet(PREVIEW_SNAPSHOT_KEY);
      if(!snap?.previewCommitSha) throw new Error('找不到可套用的測試版。請先重新發布測試版。');
      if(!confirm('你已經實際打開測試版，確認桌機／平板／手機都正常嗎？\n\n確定後才會修改正式網站。')) return;
      const files=snap.productionFiles||[];
      if(!files.length){ throw new Error('測試版沒有偵測到正式內容變更。'); }
      const sha=await commitFiles({
        ...settings,files,
        message:`Promote CHINON V10 preview to live ${new Date().toLocaleString('zh-TW')}`,
        expectedHead:snap.previewCommitSha
      });
      publishProgress(`正式網站已套用「剛剛測試版」的同一份內容快照。\nCommit：${sha.slice(0,7)}\n\nGitHub Pages 需要一點時間重新部署。`,'ok');
      setStatus('正式網站已套用測試版快照。');
      $('#btnPromote').disabled=true;
    }
  }catch(err){
    console.error(err); publishProgress(`失敗：${err.message}`,'error'); setStatus(`發布失敗：${err.message}`);
  }finally{ btn.disabled=false; }
}

/* ---------- events ---------- */
iframe.addEventListener('load',()=>{
  const doc=iframe.contentDocument;
  try{
    injectEditorUi(doc);
    selected=null; $('#selectedLabel').textContent='尚未選取';
    setStatus(`${SITE_PAGES.find(x=>x.file===currentFile)?.name||currentFile} 已載入。你現在看到的就是同一份網站 DOM。`);
  }catch(err){ console.error(err); setStatus(`畫布初始化失敗：${err.message}`); }
});
$('#pageSelect').addEventListener('change',e=>loadPage(e.target.value));
$('#btnReload').addEventListener('click',reloadCurrentFromLive);
$('#btnSave').addEventListener('click',saveDraftState);
$('#btnUndo').addEventListener('click',undo);
$('#btnRedo').addEventListener('click',redo);

$('#btnAddImage').addEventListener('click',()=>$('#addImageInput').click());
$('#addImageInput').addEventListener('change',async e=>{ await addImage(e.target.files?.[0]); e.target.value=''; });
$('#btnReplaceImage').addEventListener('click',()=>$('#replaceImageInput').click());
$('#replaceImageInput').addEventListener('change',async e=>{ await replaceImage(e.target.files?.[0]); e.target.value=''; });
$('#btnBackground').addEventListener('click',()=>$('#backgroundInput').click());
$('#backgroundInput').addEventListener('change',async e=>{ await setBackground(e.target.files?.[0]); e.target.value=''; });

$('#btnFloat').addEventListener('click',floatSelected);
$('#btnUnfloat').addEventListener('click',unfloatSelected);
$('#btnDeleteAdded').addEventListener('click',deleteAdded);
$('#btnImgLeft').addEventListener('click',()=>alignImage('left'));
$('#btnImgCenter').addEventListener('click',()=>alignImage('center'));
$('#btnImgRight').addEventListener('click',()=>alignImage('right'));
$('#btnApplyLink').addEventListener('click',applyLink);

[
 ['fontFamily','fontFamily'],['fontSize','fontSize'],['fontWeight','fontWeight'],
 ['textAlign','textAlign'],['lineHeight','lineHeight'],['letterSpacing','letterSpacing'],
 ['textShadow','textShadow'],['widthCtl','width'],['marginTop','marginTop'],
 ['marginBottom','marginBottom'],['paddingTop','paddingTop'],['paddingBottom','paddingBottom'],
 ['objectFit','objectFit'],['objectPosition','objectPosition'],['backgroundPosition','backgroundPosition'],
 ['backgroundSize','backgroundSize'],['borderRadius','borderRadius'],['boxShadow','boxShadow']
].forEach(([id,prop])=>bindSelect(id,prop));
$('#textColor').addEventListener('change',e=>applyStyle('color',e.target.value));
$('#backgroundColor').addEventListener('change',e=>applyStyle('backgroundColor',e.target.value));

document.querySelectorAll('.devices button').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.devices button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const w=+btn.dataset.width;
  frameBox.style.width=`min(${w}px,100%)`;
}));

$('#btnPreviewPublish').addEventListener('click',()=>openPublish('preview'));
$('#btnCheckPreview').addEventListener('click',verifyPreviewNow);
$('#btnPromote').addEventListener('click',()=>openPublish('promote'));
$('#btnDoPublish').addEventListener('click',doPublish);
$('#btnOpenPreview').addEventListener('click',async()=>{
  const ok=await verifyPreviewNow();
  if(!ok) return;
  const url=latestPreviewUrl||`${location.origin}/preview/index.html?v=${Date.now()}`;
  window.open(url,'_blank','noopener');
});

/* ---------- startup ---------- */
(async()=>{
  try{
    await restoreDraftState();
    const preview=await dbGet(PREVIEW_SNAPSHOT_KEY);
    if(preview?.previewCommitSha){
      latestPreviewCommit=preview.previewCommitSha;
      latestPreviewId=preview.previewId||'';
      latestPreviewUrl=`${location.origin}/preview/index.html?v=${Date.now()}`;
      $('#btnCheckPreview').disabled=false;
      const ready=await checkPreviewReady(latestPreviewId);
      $('#btnOpenPreview').disabled=!ready;
      $('#btnPromote').disabled=!(ready && preview?.dirtyFiles?.length);
    }
    await loadPage('index.html');
  }catch(err){
    console.error(err); setStatus(`啟動失敗：${err.message}`);
  }
})();
})();