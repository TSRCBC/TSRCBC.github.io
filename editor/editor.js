(() => {
'use strict';

const BUILD = 'V10.9 SAFE SYNC';
const FONT_URL = 'https://fonts.googleapis.com/css2?family=Iansui&family=Klee+One:wght@400;600&family=LXGW+WenKai+TC:wght@400;700&family=Noto+Sans+TC:wght@300;400;500;600;700;800;900&family=Noto+Serif+TC:wght@400;500;600;700;800;900&family=Yuji+Syuku&family=Zen+Kurenaido&display=swap';

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
const buildLabel = $('#buildLabel');
if(buildLabel) buildLabel.textContent=BUILD;
document.title=`CHINON 視覺網站編輯器 ${BUILD}`;
const DRAFT_DB = 'chinon-v10-editor';
const DRAFT_STORE = 'state';
const DRAFT_KEY = 'draft-v10';
const PREVIEW_SNAPSHOT_KEY = 'preview-snapshot-v10';
const DRAFT_HISTORY_KEY = 'draft-history-v10';
const DRAFT_HISTORY_LIMIT = 20;
const PUBLISH_SETTINGS_KEY = 'chinon-v10-publish-settings';
const TOKEN_SESSION_KEY = 'chinon-v10-token';
const TOKEN_LOCAL_KEY = 'chinon-v10-token-local';

let currentFile = null;
let hasLoadedPage = false;
let draftSaveTimer = null;
let currentBaseHash = '';
let currentBaseRepoSha = '';
let currentLiveSource = '';
let selected = null;
let currentDirty = false;
let dragState = null;
let resizeState = null;
let pendingFlowImagePosition = 'above';
let pageDrafts = new Map();
let draftHistory = new Map();
let undoStack = [];
let redoStack = [];
let latestPreviewUrl = '';
let latestPreviewCommit = '';
let latestPreviewId = '';

const EDITOR_STYLE_ID = 'chinon-v10-editor-style';
const HANDLE_ID = 'chinon-v10-resize-handle';
const FLOW_IMAGE_BLOCK_CLASS = 'chinon-flow-image-block';
const SELECT_ATTR = 'data-chinon-v10-selected';
const ADDED_ATTR = 'data-chinon-v10-added';
const FLOAT_ATTR = 'data-chinon-v10-float';
const PLACEHOLDER_ATTR = 'data-chinon-v10-placeholder';
const FLOAT_STYLE_BACKUP_ATTR = 'data-chinon-v10-float-style-backup';
const FLOAT_PARENT_POS_BACKUP_ATTR = 'data-chinon-v10-parent-position-backup';
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
async function persistDraftMap({silent=false}={}){
  const savedAt=Date.now();
  const payload={version:1070,pages:[...pageDrafts.entries()],savedAt};
  await dbPut(DRAFT_KEY,payload);
  if(!silent){
    const t=new Date(savedAt).toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    setStatus(`草稿已儲存 ${t}。重新整理後會保留；正式網站沒有變更。`);
  }
  return true;
}
async function saveDraftState({silent=false,capture=true}={}){
  if(capture && hasLoadedPage) captureCurrentPage();
  return persistDraftMap({silent});
}
function scheduleDraftSave(){
  clearTimeout(draftSaveTimer);
  draftSaveTimer=setTimeout(()=>{
    saveDraftState({silent:true}).catch(err=>{
      console.error('自動儲存失敗',err);
      setStatus(`自動儲存失敗：${err.message}`);
    });
  },500);
}
async function restoreDraftState(){
  const saved=await dbGet(DRAFT_KEY);
  if(saved?.pages) pageDrafts=new Map(saved.pages);
  const historySaved=await dbGet(DRAFT_HISTORY_KEY);
  if(historySaved?.pages) draftHistory=new Map(historySaved.pages);
}
async function persistDraftHistory(){
  await dbPut(DRAFT_HISTORY_KEY,{version:1070,pages:[...draftHistory.entries()],savedAt:Date.now()});
}
function draftHistoryFor(file){
  return Array.isArray(draftHistory.get(file)) ? draftHistory.get(file) : [];
}
async function addDraftHistory(file,snapshot,{reason='手動儲存',silent=false}={}){
  if(!file || !snapshot?.html) return null;
  const list=draftHistoryFor(file);
  const last=list[0];
  if(last?.html===snapshot.html && last?.reason===reason){
    return last;
  }
  const entry={
    id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    savedAt:Date.now(),
    reason,
    html:snapshot.html,
    baseHash:snapshot.baseHash||'',
    baseRepoSha:snapshot.baseRepoSha||'',
    dirty:snapshot.dirty!==false
  };
  list.unshift(entry);
  draftHistory.set(file,list.slice(0,DRAFT_HISTORY_LIMIT));
  await persistDraftHistory();
  if(!silent){
    const t=new Date(entry.savedAt).toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    setStatus(`已建立可恢復草稿版本 ${t}（${reason}）。`);
  }
  return entry;
}

/* ---------- helpers ---------- */
async function hashText(text){ return sha256Hex(text); }
async function fetchLive(file){
  const res=await fetch(`../${file}?v10=${Date.now()}`,{cache:'no-store'});
  if(!res.ok) throw new Error(`${file} 讀取失敗 (${res.status})`);
  return await res.text();
}

function readStoredRepoSettings(){
  let s={};
  try{s=JSON.parse(localStorage.getItem(PUBLISH_SETTINGS_KEY)||'{}')}catch{}
  return {
    owner:s.owner||'TSRCBC',
    repo:s.repo||'TSRCBC.github.io',
    branch:s.branch||'main',
    token:localStorage.getItem(TOKEN_LOCAL_KEY)||sessionStorage.getItem(TOKEN_SESSION_KEY)||''
  };
}
function decodeGithubBase64(value){
  const binary=atob(String(value||'').replace(/\n/g,''));
  const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}
async function fetchRepoFileState(file,settings=null){
  const s=settings||readStoredRepoSettings();
  const headers={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
  if(s.token) headers.Authorization=`Bearer ${s.token}`;
  const url=`https://api.github.com/repos/${encodeURIComponent(s.owner)}/${encodeURIComponent(s.repo)}/contents/${encodeURIComponent(file)}?ref=${encodeURIComponent(s.branch||'main')}&_=${Date.now()}`;
  const res=await fetch(url,{cache:'no-store',headers});
  if(!res.ok){
    let detail=''; try{detail=(await res.json())?.message||''}catch{}
    throw new Error(`GitHub ${file} 讀取失敗 (${res.status}${detail?`：${detail}`:''})`);
  }
  const data=await res.json();
  if(data.type!=='file' || !data.sha) throw new Error(`GitHub ${file} 不是可讀取的檔案`);
  let text='';
  if(data.content && data.encoding==='base64') text=decodeGithubBase64(data.content);
  else if(data.download_url){
    const raw=await fetch(`${data.download_url}${data.download_url.includes('?')?'&':'?'}_=${Date.now()}`,{cache:'no-store'});
    if(!raw.ok) throw new Error(`GitHub ${file} 原始內容讀取失敗 (${raw.status})`);
    text=await raw.text();
  }else throw new Error(`GitHub ${file} 沒有可讀內容`);
  return {text,sha:data.sha,source:'github'};
}
async function fetchEditorSource(file,settings=null){
  try{
    return await fetchRepoFileState(file,settings);
  }catch(err){
    console.warn('GitHub source fallback to Pages',err);
    const text=await fetchLive(file);
    return {text,sha:'',source:'pages',warning:err.message};
  }
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
  pageDrafts.set(currentFile,{
    html,
    baseHash:currentBaseHash,
    baseRepoSha:currentBaseRepoSha||'',
    dirty:currentDirty
  });
}
function markDirty(){
  currentDirty=true;
  const draft=pageDrafts.get(currentFile);
  if(draft) draft.dirty=true;
  $('#btnPromote').disabled=true;
  latestPreviewCommit='';
  setStatus('有尚未發布的修改。草稿會自動儲存；先「① 發布測試版」查看實際結果。');
  scheduleDraftSave();
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

function navigateFrame({src=null,srcdoc=null}){
  return new Promise((resolve,reject)=>{
    let done=false;
    const timer=setTimeout(()=>{
      if(done) return;
      done=true;
      reject(new Error('畫布載入超過 15 秒，請重新整理後再試。'));
    },15000);
    const finish=()=>{
      if(done) return;
      done=true;
      clearTimeout(timer);
      resolve();
    };
    iframe.addEventListener('load',finish,{once:true});
    if(srcdoc!==null){
      iframe.removeAttribute('src');
      iframe.srcdoc=srcdoc;
    }else{
      iframe.removeAttribute('srcdoc');
      iframe.src=src;
    }
  });
}

/* ---------- load pages ---------- */
async function loadPage(file,{forceLive=false,skipCapture=false}={}){
  if(!skipCapture && currentFile && hasLoadedPage && iframe.contentDocument?.documentElement){
    captureCurrentPage();
    await persistDraftMap({silent:true});
  }

  currentFile=file;
  hasLoadedPage=false;
  $('#pageSelect').value=file;
  selected=null;
  $('#selectedLabel').textContent='尚未選取';
  undoStack=[]; redoStack=[];
  setStatus(`正在載入 ${SITE_PAGES.find(x=>x.file===file)?.name||file}…`);

  const source=await fetchEditorSource(file);
  const live=source.text;
  currentLiveSource=live;
  currentBaseHash=await hashText(live);
  currentBaseRepoSha=source.sha||'';

  const draft=pageDrafts.get(file);
  if(!forceLive && draft?.html && /<body[\s>]/i.test(draft.html) && draft.html.length>300){
    // V10.6 舊草稿沒有 baseRepoSha：絕不刪除，第一次由 V10.7 安全接管。
    if(!draft.baseRepoSha && currentBaseRepoSha){
      draft.baseRepoSha=currentBaseRepoSha;
      draft.baseHash=draft.baseHash||currentBaseHash;
      pageDrafts.set(file,draft);
      await persistDraftMap({silent:true});
    }
    currentDirty=!!draft.dirty;
    currentBaseHash=draft.baseHash||currentBaseHash;
    currentBaseRepoSha=draft.baseRepoSha||currentBaseRepoSha;
    await navigateFrame({srcdoc:toEditorSrcdoc(draft.html)});
    if(source.warning){
      setStatus(`${SITE_PAGES.find(x=>x.file===file)?.name||file} 已載入本機草稿；GitHub API 暫時不可用，稍後發布時會再次驗證。`);
    }
  }else{
    currentDirty=false;
    // 直接用 GitHub Repository 裡的 HTML 當編輯基準，避免 GitHub Pages 部署延遲造成假衝突。
    await navigateFrame({srcdoc:toEditorSrcdoc(live)});
    pageDrafts.set(file,{
      html:live,
      baseHash:currentBaseHash,
      baseRepoSha:currentBaseRepoSha||'',
      dirty:false
    });
    await persistDraftMap({silent:true});
  }
}
async function reloadCurrentFromLive(){
  if(!currentFile) return;
  if(!confirm('會重新載入 GitHub 目前正式檔案。\n\n你現在的畫面會先自動備份到「草稿版本」，不會被永久刪除。確定繼續？')) return;

  if(hasLoadedPage){
    captureCurrentPage();
    const before=pageDrafts.get(currentFile);
    if(before?.html) await addDraftHistory(currentFile,before,{reason:'重新載入前自動備份',silent:true});
    await persistDraftMap({silent:true});
  }

  currentDirty=false;
  await loadPage(currentFile,{forceLive:true,skipCapture:true});
  const clean=pageDrafts.get(currentFile);
  if(clean) clean.dirty=false;
  await persistDraftMap({silent:true});
  setStatus('已重新載入 GitHub 目前版本。剛才的內容已保存在「草稿版本」，需要時可恢復。');
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
    [${FLOAT_ATTR}]{cursor:move!important;touch-action:none!important;user-select:none!important;-webkit-user-select:none!important}
    img[${FLOAT_ATTR}]{-webkit-user-drag:none!important}
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
    // 讓網站本身的手機選單按鈕正常執行，不被編輯器 capture 階段攔截。
    if(e.target.closest?.('.menu-toggle')) return;
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
    const el=e.target.closest?.(`[${FLOAT_ATTR}]`);
    if(!el || e.target.id===HANDLE_ID) return;
    startFloatDrag(e,el);
  },true);

  doc.addEventListener('dragstart',e=>{
    const el=e.target.closest?.(`[${FLOAT_ATTR}]`);
    if(el) e.preventDefault();
  },true);

  doc.defaultView.addEventListener('scroll',updateHandle,{passive:true});
  doc.defaultView.addEventListener('resize',updateHandle);
}
function selectElement(el){
  if(!el || el===iframe.contentDocument?.body || el===iframe.contentDocument?.documentElement) return;
  if(selected) selected.removeAttribute(SELECT_ATTR);
  selected=el;
  selected.setAttribute(SELECT_ATTR,'1');
  const flowLabel=el.tagName==='IMG' && el.closest?.(`.${FLOW_IMAGE_BLOCK_CLASS}`) ? '｜圖片區塊' : '';
  $('#selectedLabel').textContent=`${el.tagName.toLowerCase()}${el.id?'#'+el.id:''}${el.classList.length?'.'+[...el.classList].slice(0,2).join('.'):''}${flowLabel}`;
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
function ensureFontLink(doc=iframe.contentDocument){
  if(!doc?.head) return;
  let link=doc.head.querySelector('link[data-chinon-fonts]');
  if(!link){
    link=doc.createElement('link');
    link.rel='stylesheet';
    link.href=FONT_URL;
    link.setAttribute('data-chinon-fonts','1');
    doc.head.appendChild(link);
  }
}
function applyStyle(prop,value){
  if(!selected || value==='') return;
  pushUndo();
  if(prop==='fontFamily') ensureFontLink();
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


/* ---------- Wix external image helper ---------- */
let wixImageCursor = -1;
function wixImagesOnPage(){
  const doc=iframe.contentDocument;
  if(!doc) return [];
  return [...doc.querySelectorAll('img[src*="wixstatic.com"]')];
}
function findNextWixImage(){
  const list=wixImagesOnPage();
  if(!list.length){
    wixImageCursor=-1;
    setStatus('這一頁已經沒有 Wix 外部圖片。');
    alert('這一頁已經沒有 Wix 外部圖片。');
    return;
  }
  wixImageCursor=(wixImageCursor+1)%list.length;
  const img=list[wixImageCursor];
  selectElement(img);
  img.scrollIntoView({behavior:'smooth',block:'center'});
  setStatus(`本頁仍有 ${list.length} 張 Wix 圖片。現在選到第 ${wixImageCursor+1} 張；按「換圖片」上傳你的照片即可。`);
}

/* ---------- images ---------- */
function fileToDataUrl(file){
  return new Promise((resolve,reject)=>{
    const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(file);
  });
}
async function prepareImageDataUrl(file){
  if(!file) return '';
  if(!/^image\//i.test(file.type||'')) throw new Error('請選擇圖片檔案。');
  if(file.size<=2*1024*1024) return fileToDataUrl(file);
  try{
    const bitmap=await createImageBitmap(file);
    const maxSide=2200;
    const scale=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height));
    const w=Math.max(1,Math.round(bitmap.width*scale));
    const h=Math.max(1,Math.round(bitmap.height*scale));
    const canvas=document.createElement('canvas'); canvas.width=w; canvas.height=h;
    const ctx=canvas.getContext('2d',{alpha:true});
    ctx.drawImage(bitmap,0,0,w,h); bitmap.close?.();
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('圖片壓縮失敗')),'image/webp',0.9));
    return fileToDataUrl(new File([blob],'optimized.webp',{type:'image/webp'}));
  }catch(err){
    console.warn('圖片最佳化失敗，改用原檔',err);
    return fileToDataUrl(file);
  }
}
function findInsertContainer(){
  if(!selected) return iframe.contentDocument.body;
  return selected.closest('section,header,footer,main,article,.container,div') || selected.parentElement || iframe.contentDocument.body;
}

function resolveFlowAnchor(){
  if(!selected){
    throw new Error('請先點選「品牌歷程」之類的標題或內容區塊，再選擇插入上方／下方。');
  }
  const doc=iframe.contentDocument;
  const main=doc?.querySelector('main');
  if(main && main.contains(selected)){
    let node=selected;
    while(node.parentElement && node.parentElement!==main){
      node=node.parentElement;
    }
    if(node.parentElement===main) return node;
  }
  return selected.closest?.('section,article,.section,.split-story') || selected;
}
function createFlowImageBlock(doc,src){
  const block=doc.createElement('div');
  block.className=FLOW_IMAGE_BLOCK_CLASS;
  block.setAttribute(ADDED_ATTR,'1');
  block.style.cssText=[
    'width:100%',
    'box-sizing:border-box',
    'padding:40px 24px',
    'display:flex',
    'justify-content:center',
    'align-items:center',
    'clear:both',
    'position:relative'
  ].join(';')+';';

  const img=doc.createElement('img');
  img.src=src;
  img.alt='';
  img.setAttribute(ADDED_ATTR,'1');
  img.style.cssText=[
    'display:block',
    'width:52%',
    'max-width:100%',
    'height:auto',
    'margin:0 auto',
    'object-fit:contain'
  ].join(';')+';';
  block.appendChild(img);
  return {block,img};
}
async function insertFlowImage(file,position='above'){
  if(!file) return;
  let anchor;
  try{
    anchor=resolveFlowAnchor();
  }catch(err){
    alert(err.message);
    return;
  }
  if(!anchor?.parentElement){
    alert('找不到可插入的位置，請改點選標題或內容區塊後再試一次。');
    return;
  }

  pushUndo();
  const src=await prepareImageDataUrl(file);
  const doc=iframe.contentDocument;
  const {block,img}=createFlowImageBlock(doc,src);

  if(position==='below') anchor.insertAdjacentElement('afterend',block);
  else anchor.insertAdjacentElement('beforebegin',block);

  selectElement(img);
  markDirty();
  block.scrollIntoView({block:'center',behavior:'smooth'});
  setStatus(position==='below'
    ? '圖片區塊已插入下方。這是正常排版：圖片放大時，下面內容會自動往下移。'
    : '圖片區塊已插入上方。這是正常排版：圖片放大時，下面內容會自動往下移。');
}
function requestFlowImage(position){
  if(!selected){
    alert('先點選要當作定位基準的標題或區塊，例如「品牌歷程」，再按「＋圖片區塊 ↑／↓」。');
    return;
  }
  pendingFlowImagePosition=position;
  $('#flowImageInput').click();
}

async function addImage(file){
  if(!file) return;
  pushUndo();
  const src=await prepareImageDataUrl(file);
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
  pushUndo(); selected.src=await prepareImageDataUrl(file); markDirty(); updateHandle();
}
async function setBackground(file){
  if(!file || !selected){ alert('請先點選要設定背景的區塊。'); return; }
  pushUndo(); const src=await prepareImageDataUrl(file);
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
  const flowBlock=selected.closest?.(`.${FLOW_IMAGE_BLOCK_CLASS}`);
  if(flowBlock){
    flowBlock.style.display='flex';
    flowBlock.style.justifyContent=mode==='left'?'flex-start':mode==='right'?'flex-end':'center';
    selected.style.marginLeft='0';
    selected.style.marginRight='0';
  }else{
    if(mode==='left'){ selected.style.marginLeft='0'; selected.style.marginRight='auto'; }
    if(mode==='center'){ selected.style.marginLeft='auto'; selected.style.marginRight='auto'; }
    if(mode==='right'){ selected.style.marginLeft='auto'; selected.style.marginRight='0'; }
  }
  selected.style.objectPosition='center center';
  markDirty();
}

/* ---------- float drag ---------- */
function floatSelected(){
  if(!selected){ alert('請先選取要移動的圖片或物件。'); return; }
  if(selected.closest?.('.site-header .brand') || selected.classList?.contains('menu-toggle')){
    alert('網站 Logo／導覽核心元件不建議自由移動。請選其他圖片或內容。'); return;
  }
  if(selected.hasAttribute(FLOAT_ATTR)){
    setStatus('此物件已是自由擺放模式。直接按住物件拖曳即可。');
    return;
  }
  pushUndo();
  const id='float-'+Date.now().toString(36);
  selected.setAttribute(FLOAT_STYLE_BACKUP_ATTR,encodeURIComponent(selected.getAttribute('style')||''));
  selected.setAttribute(FLOAT_ATTR,id);
  $('#selectedLabel').textContent=`${selected.tagName.toLowerCase()}｜自由擺放`;
  selected.setAttribute('data-chinon-v10-drag-x','0');
  selected.setAttribute('data-chinon-v10-drag-y','0');
  selected.style.translate='0px 0px';
  selected.style.touchAction='none';
  selected.style.cursor='move';
  if(selected.tagName==='IMG') selected.draggable=false;
  markDirty(); updateHandle();
  setStatus('自由擺放已啟用：直接按住這個物件本身拖曳即可。');
}
function unfloatSelected(){
  if(!selected || !selected.hasAttribute(FLOAT_ATTR)){ alert('目前選取物件不是自由擺放物件。'); return; }
  pushUndo();
  const backup=decodeURIComponent(selected.getAttribute(FLOAT_STYLE_BACKUP_ATTR)||'');
  if(backup) selected.setAttribute('style',backup); else selected.removeAttribute('style');
  selected.removeAttribute(FLOAT_ATTR);
  selected.removeAttribute(FLOAT_STYLE_BACKUP_ATTR);
  selected.removeAttribute('data-chinon-v10-drag-x');
  selected.removeAttribute('data-chinon-v10-drag-y');
  if(selected.tagName==='IMG') selected.removeAttribute('draggable');
  markDirty(); updateHandle();
  setStatus('已回到原本排版位置。');
}
function startFloatDrag(e,el){
  if(e.button!==undefined && e.button!==0) return;
  e.preventDefault(); e.stopPropagation();
  selectElement(el); pushUndo();
  const x=parseFloat(el.getAttribute('data-chinon-v10-drag-x'))||0;
  const y=parseFloat(el.getAttribute('data-chinon-v10-drag-y'))||0;
  dragState={el,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,x,y};
  try{ el.setPointerCapture?.(e.pointerId); }catch{}
  const doc=iframe.contentDocument, win=iframe.contentWindow;
  doc.addEventListener('pointermove',onFloatMove,true);
  win.addEventListener('pointermove',onFloatMove,true);
  doc.addEventListener('pointerup',endFloatDrag,true);
  win.addEventListener('pointerup',endFloatDrag,true);
  doc.addEventListener('pointercancel',endFloatDrag,true);
  win.addEventListener('pointercancel',endFloatDrag,true);
}
function onFloatMove(e){
  if(!dragState) return;
  e.preventDefault?.();
  const nx=dragState.x+(e.clientX-dragState.startX);
  const ny=dragState.y+(e.clientY-dragState.startY);
  dragState.el.setAttribute('data-chinon-v10-drag-x',String(nx));
  dragState.el.setAttribute('data-chinon-v10-drag-y',String(ny));
  dragState.el.style.translate=`${nx.toFixed(1)}px ${ny.toFixed(1)}px`;
  updateHandle();
}
function endFloatDrag(e){
  if(!dragState) return;
  const {el,pointerId}=dragState;
  const doc=iframe.contentDocument, win=iframe.contentWindow;
  doc.removeEventListener('pointermove',onFloatMove,true);
  win.removeEventListener('pointermove',onFloatMove,true);
  doc.removeEventListener('pointerup',endFloatDrag,true);
  win.removeEventListener('pointerup',endFloatDrag,true);
  doc.removeEventListener('pointercancel',endFloatDrag,true);
  win.removeEventListener('pointercancel',endFloatDrag,true);
  try{ el.releasePointerCapture?.(pointerId); }catch{}
  dragState=null; markDirty();
  setStatus('位置已移動並自動儲存草稿。');
}
function deleteAdded(){
  if(!selected){ alert('請先選取要刪除的圖片或新增物件。'); return; }
  const isImage=selected.tagName==='IMG';
  const isAdded=selected.hasAttribute(ADDED_ATTR);
  const isProtected=!!selected.closest?.('.site-header .brand') || !!selected.closest?.('.footer-brand .brand-inline');
  if(isProtected){ alert('Logo／品牌識別屬於核心元件，為避免導覽損壞，這裡不允許刪除。'); return; }
  if(!isImage && !isAdded){ alert('目前安全刪除支援「圖片」與你在編輯器新增的物件。'); return; }
  if(!confirm(isImage?'確定刪除這張圖片？\n\n可以用 Undo 復原。':'確定刪除這個新增物件？\n\n可以用 Undo 復原。')) return;
  pushUndo();
  const id=selected.getAttribute(FLOAT_ATTR);
  if(id) iframe.contentDocument.querySelector(`[${PLACEHOLDER_ATTR}="${CSS.escape(id)}"]`)?.remove();
  const flowBlock=selected.closest?.(`.${FLOW_IMAGE_BLOCK_CLASS}`);
  if(flowBlock && isImage) flowBlock.remove();
  else selected.remove();
  selected=null;
  $('#selectedLabel').textContent='尚未選取'; markDirty();
  setStatus(flowBlock && isImage ? '圖片區塊已刪除；需要復原可按 Undo。' : '物件已刪除；需要復原可按 Undo。');
}

/* ---------- link ---------- */
function applyLink(){
  if(!selected) return;
  const url=$('#linkUrl').value.trim();
  if(!url) return;
  pushUndo();
  const existing=selected.closest?.('a');
  if(existing){
    existing.setAttribute('href',url);
    selected=existing;
  }else if(selected.tagName==='A'){
    selected.setAttribute('href',url);
  }else{
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
  doc.querySelectorAll(`[${PLACEHOLDER_ATTR}]`).forEach(el=>el.remove());
  doc.querySelectorAll('*').forEach(el=>{
    el.removeAttribute(SELECT_ATTR);
    el.removeAttribute('data-chinon-v10-editing');
    el.removeAttribute(ADDED_ATTR);
    el.removeAttribute(FLOAT_ATTR);
    el.removeAttribute(FLOAT_STYLE_BACKUP_ATTR);
    el.removeAttribute(FLOAT_PARENT_POS_BACKUP_ATTR);
    el.removeAttribute('data-chinon-v10-drag-x');
    el.removeAttribute('data-chinon-v10-drag-y');
    el.removeAttribute('contenteditable');
    if(el.getAttribute('draggable')==='false' && el.tagName==='IMG') el.removeAttribute('draggable');
  });
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
async function currentDraftSignature(){
  if(hasLoadedPage) captureCurrentPage();
  const parts=[];
  for(const page of SITE_PAGES){
    const d=pageDrafts.get(page.file);
    parts.push(d?.dirty ? `${page.file}|${d.baseHash}|${d.html}` : `${page.file}|CLEAN`);
  }
  return hashText(parts.join('\n---PAGE---\n'));
}
function hasConflictMarkers(text){
  const s=String(text||'');
  return /<<<<<<<\s|=======|>>>>>>>\s/.test(s) || /&lt;&lt;&lt;&lt;&lt;&lt;&lt;\s*HEAD/i.test(s) || /&gt;&gt;&gt;&gt;&gt;&gt;&gt;/.test(s);
}
function inspectSiteHtml(text){
  if(hasConflictMarkers(text)) return {ok:false,detail:'偵測到 Git 合併衝突標記'};
  const doc=new DOMParser().parseFromString(text,'text/html');
  const required=[
    ['Logo','.site-header .brand img'],['品牌中文','.site-header .brand strong'],['品牌英文','.site-header .brand small'],
    ['導覽列','.site-header .nav-links'],['手機選單','.site-header .menu-toggle'],['主要內容','main'],['main.js','script[src*="main.js"]']
  ];
  const missing=required.filter(([,sel])=>!doc.querySelector(sel)).map(([name])=>name);
  if(missing.length) return {ok:false,detail:`缺少：${missing.join('、')}`};
  return {ok:true,detail:'結構正常、無衝突標記'};
}
function assertSafeHtml(text,label='頁面'){
  const r=inspectSiteHtml(text);
  if(!r.ok) throw new Error(`${label} 不安全：${r.detail}`);
}

async function runCoreChecks(){
  const results=[];
  const add=(name,ok,detail='')=>results.push({name,ok,detail});
  try{
    const key='__chinon_selftest__'; const value={t:Date.now(),build:BUILD};
    await dbPut(key,value); const back=await dbGet(key);
    add('草稿資料庫 IndexedDB',back?.t===value.t,'可寫入並讀回');
  }catch(err){ add('草稿資料庫 IndexedDB',false,err.message); }
  try{
    const res=await fetch(`../styles.css?selfcheck=${Date.now()}`,{cache:'no-store'});
    add('正式 styles.css',res.ok,res.ok?'讀取正常':`HTTP ${res.status}`);
  }catch(err){ add('正式 styles.css',false,err.message); }
  for(const page of SITE_PAGES){
    try{
      const res=await fetch(`../${page.file}?selfcheck=${Date.now()}`,{cache:'no-store'});
      if(!res.ok){ add(`${page.name}頁面`,false,`HTTP ${res.status}`); continue; }
      const text=await res.text();
      const check=inspectSiteHtml(text);
      add(`${page.name}頁面`,check.ok,check.detail);
    }catch(err){ add(`${page.name}頁面`,false,err.message); }
  }
  try{
    const doc=iframe.contentDocument;
    const ok=!!doc?.body && doc.body.innerHTML.trim().length>50;
    add('目前編輯畫布',ok,ok?'DOM 可存取':'畫布內容為空或無法存取');
  }catch(err){ add('目前編輯畫布',false,err.message); }
  add('版本標示',buildLabel?.textContent===BUILD,buildLabel?.textContent||'找不到版本標示');
  return {ok:results.every(x=>x.ok),results};
}

function makeBaselineMismatchError(page,draft,repo){
  const err=new Error(`${page.name} 的 GitHub 正式檔案真的已經變更（不是 Pages 部署延遲）。草稿仍完整保留。`);
  err.code='BASELINE_MISMATCH';
  err.file=page.file;
  err.pageName=page.name;
  err.oldSha=draft?.baseRepoSha||'';
  err.newSha=repo?.sha||'';
  return err;
}

async function ensureDraftRepoBaseline(page,draft,settings){
  const repo=await fetchRepoFileState(page.file,settings);
  if(!draft.baseRepoSha){
    // V10.6 舊草稿第一次升級：保留草稿，綁定目前 Repository 檔案版本。
    draft.baseRepoSha=repo.sha;
    if(!draft.baseHash) draft.baseHash=await hashText(repo.text);
    pageDrafts.set(page.file,draft);
    await persistDraftMap({silent:true});
    return repo;
  }
  if(repo.sha!==draft.baseRepoSha){
    throw makeBaselineMismatchError(page,draft,repo);
  }
  return repo;
}
async function preflightBeforePreview(settings){
  await saveDraftState({silent:true});
  const checks=await runCoreChecks();
  if(!checks.ok){
    const failed=checks.results.filter(x=>!x.ok).map(x=>`${x.name}：${x.detail}`).join('；');
    throw new Error(`發布前檢查未通過：${failed}`);
  }
  for(const page of SITE_PAGES){
    const d=pageDrafts.get(page.file);
    if(!d?.dirty) continue;
    await ensureDraftRepoBaseline(page,d,settings);
  }
  return checks;
}
async function buildPreviewSnapshot(settings){
  captureCurrentPage();
  await persistDraftMap({silent:true});
  const previewFiles=new Map();
  const productionFiles=new Map();
  const assetFiles=new Map();
  const assetState={id:Date.now().toString(36),n:1};
  const dirtyFiles=[];

  for(const page of SITE_PAGES){
    const repo=await fetchRepoFileState(page.file,settings);
    const draft=pageDrafts.get(page.file);
    let source=repo.text;
    let dirty=false;

    if(draft?.dirty){
      if(!draft.baseRepoSha){
        draft.baseRepoSha=repo.sha;
        pageDrafts.set(page.file,draft);
      }else if(draft.baseRepoSha!==repo.sha){
        throw makeBaselineMismatchError(page,draft,repo);
      }
      source=draft.html; dirty=true; dirtyFiles.push(page.file);
    }

    assertSafeHtml(source,page.name);
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

  const draftSignature=await currentDraftSignature();
  return {
    createdAt:Date.now(),
    previewId:assetState.id,
    draftSignature,
    viewedAt:null,
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
async function snapshotStillMatchesDraft(snap){
  if(!snap?.draftSignature) return false;
  return (await currentDraftSignature())===snap.draftSignature;
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
    $('#btnPromote').disabled=true;
    setStatus('測試版部署完成。請先按「② 開啟測試版」實際檢查，之後才會開放正式套用。');
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
      ...(token?{Authorization:`Bearer ${token}`}:{ }),
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
  for(const [path,file] of files){
    if(file.encoding!=='base64' && /\.html$/i.test(path)) assertSafeHtml(file.content,path);
    if(file.encoding!=='base64' && hasConflictMarkers(file.content)) throw new Error(`${path} 含有 Git 衝突標記，已禁止發布。`);
  }

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

let lastBaselineConflict=null;
let publishMode='preview';

async function syncLatestBaselineKeepDraft(){
  const conflict=lastBaselineConflict;
  if(!conflict?.file){
    publishProgress('目前沒有可同步的版本衝突。','error');
    return;
  }

  const settings=savePublishSettings();
  if(!settings.owner||!settings.repo||!settings.branch||!settings.token){
    publishProgress('請先完整填寫 GitHub 發布資料，再同步版本。','error');
    return;
  }

  // 先把畫面上的最新修改寫回草稿。
  if(hasLoadedPage && currentFile===conflict.file){
    captureCurrentPage();
  }
  await persistDraftMap({silent:true});

  const draft=pageDrafts.get(conflict.file);
  if(!draft?.html){
    throw new Error(`找不到 ${conflict.pageName||conflict.file} 的草稿，沒有進行同步。`);
  }

  // 同步前建立不可覆蓋的歷史版本。
  await addDraftHistory(conflict.file,draft,{reason:'同步 GitHub 前自動備份',silent:true});

  const repo=await fetchRepoFileState(conflict.file,settings);

  const oldShort=(draft.baseRepoSha||'未知').slice(0,7);
  const newShort=(repo.sha||'未知').slice(0,7);
  const ok=confirm(
    `要保留目前「${conflict.pageName||conflict.file}」草稿，並把發布基準同步到 GitHub 最新版本嗎？\n\n`+
    `目前草稿畫面不會被改掉，也不會重新載入官網。\n`+
    `舊基準：${oldShort}\n最新基準：${newShort}\n\n`+
    `注意：如果 GitHub 最新版本包含其他人對同一頁的修改，之後正式發布時可能會由你目前的草稿內容覆蓋。`+
    `只有在你確認目前草稿應該優先時才按「確定」。`
  );
  if(!ok){
    publishProgress('已取消同步。草稿沒有變更。');
    return;
  }

  draft.baseRepoSha=repo.sha;
  draft.baseHash=await hashText(repo.text);
  draft.dirty=true;
  pageDrafts.set(conflict.file,draft);

  if(currentFile===conflict.file){
    currentBaseRepoSha=repo.sha;
    currentBaseHash=draft.baseHash;
    currentDirty=true;
  }

  await persistDraftMap({silent:true});
  lastBaselineConflict=null;
  $('#baselineConflictActions').hidden=true;

  publishProgress(
    `${conflict.pageName||conflict.file} 已同步到 GitHub 最新基準 ${newShort}。\n`+
    `目前草稿內容完全保留，正式網站尚未變更。\n\n`+
    `現在可以再按「發布測試版」。`,
    'ok'
  );
  setStatus(`${conflict.pageName||conflict.file} 已保留草稿並同步 GitHub 最新基準。`);
}

async function openPublish(mode){
  if(mode==='promote'){
    const snap=await dbGet(PREVIEW_SNAPSHOT_KEY);
    if(!snap?.previewCommitSha){ alert('請先發布測試版。'); return; }
    if(!snap.viewedAt){ alert('請先按「② 開啟測試版」實際檢查，再套用正式網站。'); return; }
    if(!(await snapshotStillMatchesDraft(snap))){ alert('你在測試版產生後又修改了草稿。請重新發布測試版，確認後再套用。'); $('#btnPromote').disabled=true; return; }
    if(!(await checkPreviewReady(snap.previewId))){ alert('測試版尚未確認部署完成，不能套用正式網站。'); $('#btnPromote').disabled=true; return; }
  }
  publishMode=mode; loadPublishSettings();
  lastBaselineConflict=null;
  $('#baselineConflictActions').hidden=true;
  $('#publishTitle').textContent=mode==='preview'?'發布測試版':'套用正式網站';
  $('#publishIntro').textContent=mode==='preview'
    ? '這一步只更新 /preview/ 測試站，不會改正式首頁。發布前會先自動做完整檢查。'
    : '這一步只會使用你剛剛已開啟確認的測試版快照，套用到正式網站。';
  $('#btnDoPublish').textContent=mode==='preview'?'發布測試版':'套用正式網站';
  publishProgress(mode==='preview'?'正式網站不會在這一步變更。':'系統會再次核對測試版、草稿與 GitHub Head。');
  $('#publishDialog').showModal();
}
async function doPublish(){
  const btn=$('#btnDoPublish');
  const settings=savePublishSettings();
  if(!settings.owner||!settings.repo||!settings.branch||!settings.token){ publishProgress('請完整填寫 GitHub 發布資料。','error'); return; }
  btn.disabled=true;
  try{
    if(publishMode==='preview'){
      publishProgress('正在執行發布前檢查…');
      await preflightBeforePreview(settings);
      publishProgress('檢查通過。正在建立與目前畫面相同的測試快照…');
      const snap=await buildPreviewSnapshot(settings);
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
        $('#btnPromote').disabled=true;
        publishProgress(`測試版部署完成！\n變更頁面：${snap.dirtyFiles.join('、')||'無'}\nCommit：${sha.slice(0,7)}\n\n現在可以按「② 開啟測試版」檢查。`,'ok');
        setStatus('測試版已部署完成。正式網站尚未變更。');
      }else{
        publishProgress(`GitHub Commit 已成功，但 GitHub Pages 兩分鐘內仍未完成部署。\nCommit：${sha.slice(0,7)}\n\n請稍後按「檢查測試版部署」。正式網站沒有被修改。`,'error');
        setStatus('GitHub 已收到測試版，但 Pages 尚未部署完成。正式網站沒有變更。');
      }
    }else{
      const snap=await dbGet(PREVIEW_SNAPSHOT_KEY);
      if(!snap?.previewCommitSha) throw new Error('找不到可套用的測試版。請先重新發布測試版。');
      if(!snap.viewedAt) throw new Error('你還沒有開啟測試版確認。請先完成第 ② 步。');
      if(!(await snapshotStillMatchesDraft(snap))) throw new Error('草稿已在測試版之後修改。請重新發布測試版。');
      if(!(await checkPreviewReady(snap.previewId))) throw new Error('目前無法確認測試版已部署完成。正式發布已停止。');
      if(!confirm('你已經實際打開測試版，確認桌機／平板／手機都正常嗎？\n\n確定後才會修改正式網站。')) return;
      const files=snap.productionFiles||[];
      if(!files.length){ throw new Error('測試版沒有偵測到正式內容變更。'); }
      const sha=await commitFiles({
        ...settings,files,
        message:`Promote CHINON V10 preview to live ${new Date().toLocaleString('zh-TW')}`,
        expectedHead:snap.previewCommitSha
      });
      // 正式發布成功後，將同一份內容改成新的乾淨基準，避免下一次被自己的發布誤判成外部更新。
      for(const file of snap.dirtyFiles||[]){
        const published=(snap.productionFiles||[]).find(([path])=>path===file)?.[1]?.content;
        if(!published) continue;
        try{
          const repo=await fetchRepoFileState(file,settings);
          pageDrafts.set(file,{
            html:published,
            baseHash:await hashText(published),
            baseRepoSha:repo.sha,
            dirty:false
          });
        }catch(err){
          console.warn('正式發布後基準更新失敗',file,err);
        }
      }
      await persistDraftMap({silent:true});
      publishProgress(`正式網站已套用「剛剛測試版」的同一份內容快照。\nCommit：${sha.slice(0,7)}\n\nGitHub Pages 需要一點時間重新部署。`,'ok');
      setStatus('正式網站已套用測試版快照；草稿基準已同步到 GitHub。');
      $('#btnPromote').disabled=true;
    }
  }catch(err){
    console.error(err);
    if(err?.code==='BASELINE_MISMATCH'){
      lastBaselineConflict={
        file:err.file,
        pageName:err.pageName,
        oldSha:err.oldSha,
        newSha:err.newSha
      };
      $('#baselineConflictActions').hidden=false;
      const oldShort=(err.oldSha||'未知').slice(0,7);
      const newShort=(err.newSha||'未知').slice(0,7);
      publishProgress(
        `偵測到 ${err.pageName||err.file} 的 GitHub 正式檔案已更新。
`+
        `草稿沒有被刪除，也沒有重新載入。
`+
        `舊基準：${oldShort} → 最新：${newShort}

`+
        `若這次 GitHub 更新是你自己的更新，請按「保留草稿並同步最新版本」；`+
        `若不是，先取消並檢查正式網站。`,
        'error'
      );
      setStatus(`發布暫停：${err.pageName||err.file} 的 GitHub 基準已改變；草稿完整保留。`);
    }else{
      publishProgress(`失敗：${err.message}`,'error');
      setStatus(`發布失敗：${err.message}`);
    }
  }finally{ btn.disabled=false; }
}


/* ---------- draft history ---------- */
function pageDisplayName(file){
  return SITE_PAGES.find(x=>x.file===file)?.name||file||'目前頁面';
}
function renderDraftHistory(){
  const listEl=$('#draftHistoryList');
  const title=$('#draftHistoryTitle');
  if(!listEl) return;
  title.textContent=`草稿版本｜${pageDisplayName(currentFile)}`;
  const list=draftHistoryFor(currentFile);
  if(!list.length){
    listEl.innerHTML='<div class="draft-empty">目前還沒有手動版本。按「儲存草稿」後就會出現在這裡。</div>';
    return;
  }
  listEl.innerHTML=list.map((v,i)=>{
    const when=new Date(v.savedAt).toLocaleString('zh-TW',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'});
    const baseline=v.baseRepoSha?`GitHub ${v.baseRepoSha.slice(0,7)}`:'舊版草稿';
    return `<div class="draft-version">
      <div class="draft-version-main">
        <strong>${when}</strong>
        <span>${v.reason||'草稿版本'}</span>
        <small>${baseline}</small>
      </div>
      <button type="button" data-restore-draft="${v.id}" data-draft-index="${i}">恢復</button>
    </div>`;
  }).join('');
}
async function saveManualDraftVersion(reason='手動儲存'){
  if(hasLoadedPage) captureCurrentPage();
  await persistDraftMap({silent:true});
  const snap=pageDrafts.get(currentFile);
  if(snap?.html) await addDraftHistory(currentFile,snap,{reason});
  renderDraftHistory();
}
async function restoreDraftVersion(id){
  const list=draftHistoryFor(currentFile);
  const v=list.find(x=>x.id===id);
  if(!v) return;
  if(!confirm(`要恢復 ${new Date(v.savedAt).toLocaleString('zh-TW')} 的草稿版本嗎？\n\n目前畫面會先自動備份，所以可以再換回來。`)) return;

  if(hasLoadedPage){
    captureCurrentPage();
    const now=pageDrafts.get(currentFile);
    if(now?.html) await addDraftHistory(currentFile,now,{reason:'恢復版本前自動備份',silent:true});
  }

  const repo=await fetchEditorSource(currentFile);
  currentBaseHash=v.baseHash||await hashText(repo.text);
  currentBaseRepoSha=v.baseRepoSha||repo.sha||'';
  currentDirty=true;
  pageDrafts.set(currentFile,{
    html:v.html,
    baseHash:currentBaseHash,
    baseRepoSha:currentBaseRepoSha,
    dirty:true
  });
  await persistDraftMap({silent:true});
  await navigateFrame({srcdoc:toEditorSrcdoc(v.html)});
  $('#btnPromote').disabled=true;
  latestPreviewCommit='';
  setStatus(`已恢復 ${pageDisplayName(currentFile)} 的草稿版本；正式網站沒有變更。`);
  renderDraftHistory();
}

function renderSelfCheck(result){
  const box=$('#selfCheckResults');
  box.innerHTML=result.results.map(r=>`<div class="self-row ${r.ok?'ok':'bad'}"><span>${r.ok?'✓':'✕'} ${r.name}</span><small>${r.detail||''}</small></div>`).join('') +
    `<div class="self-summary ${result.ok?'ok':'bad'}">${result.ok?'全部通過':'有項目未通過，請不要發布'}</div>`;
}
async function runSelfCheckUi(){
  $('#selfCheckResults').textContent='檢查中…';
  $('#selfCheckDialog').showModal();
  try{ renderSelfCheck(await runCoreChecks()); }
  catch(err){ $('#selfCheckResults').textContent=`檢查失敗：${err.message}`; }
}

/* ---------- events ---------- */
iframe.addEventListener('load',()=>{
  const doc=iframe.contentDocument;
  try{
    hasLoadedPage=true;
    injectEditorUi(doc);
    selected=null; $('#selectedLabel').textContent='尚未選取';
    if(currentDirty){
      setStatus(`${SITE_PAGES.find(x=>x.file===currentFile)?.name||currentFile} 已載入本機草稿；重新整理後內容已保留。`);
    }else{
      setStatus(`${SITE_PAGES.find(x=>x.file===currentFile)?.name||currentFile} 已載入。你現在看到的就是同一份網站 DOM。`);
    }
  }catch(err){ console.error(err); setStatus(`畫布初始化失敗：${err.message}`); }
});
$('#pageSelect').addEventListener('change',async e=>{
  try{ await loadPage(e.target.value); }
  catch(err){ console.error(err); setStatus(`換頁失敗：${err.message}`); alert(`換頁失敗：${err.message}`); }
});
$('#btnReload').addEventListener('click',reloadCurrentFromLive);
$('#btnSelfCheck').addEventListener('click',runSelfCheckUi);
$('#btnRunSelfCheck').addEventListener('click',runSelfCheckUi);
$('#btnCloseSelfCheck').addEventListener('click',()=>$('#selfCheckDialog').close());
$('#btnSave').addEventListener('click',async()=>{
  try{
    await saveDraftState({silent:true});
    await saveManualDraftVersion('手動儲存');
  }catch(err){
    console.error(err);
    setStatus(`草稿儲存失敗：${err.message}`);
    alert(`草稿儲存失敗：${err.message}`);
  }
});
$('#btnDraftHistory').addEventListener('click',()=>{
  renderDraftHistory();
  $('#draftHistoryDialog').showModal();
});
$('#btnCloseDraftHistory').addEventListener('click',()=>$('#draftHistoryDialog').close());
$('#btnSaveVersionNow').addEventListener('click',async()=>{
  try{ await saveManualDraftVersion('手動建立版本'); }
  catch(err){ alert(`建立草稿版本失敗：${err.message}`); }
});
$('#draftHistoryList').addEventListener('click',async e=>{
  const btn=e.target.closest?.('[data-restore-draft]');
  if(!btn) return;
  try{ await restoreDraftVersion(btn.dataset.restoreDraft); }
  catch(err){ console.error(err); alert(`恢復草稿失敗：${err.message}`); }
});
$('#btnUndo').addEventListener('click',undo);
$('#btnRedo').addEventListener('click',redo);

$('#btnAddImage').addEventListener('click',()=>$('#addImageInput').click());
$('#addImageInput').addEventListener('change',async e=>{ await addImage(e.target.files?.[0]); e.target.value=''; });
$('#btnFlowImageAbove').addEventListener('click',()=>requestFlowImage('above'));
$('#btnFlowImageBelow').addEventListener('click',()=>requestFlowImage('below'));
$('#flowImageInput').addEventListener('change',async e=>{
  try{ await insertFlowImage(e.target.files?.[0],pendingFlowImagePosition); }
  catch(err){ console.error(err); alert(`插入圖片區塊失敗：${err.message}`); }
  e.target.value='';
});
$('#btnReplaceImage').addEventListener('click',()=>$('#replaceImageInput').click());
$('#btnFindWixImage').addEventListener('click',findNextWixImage);
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
$('#btnSyncBaselineKeepDraft').addEventListener('click',async()=>{
  const btn=$('#btnSyncBaselineKeepDraft');
  btn.disabled=true;
  try{ await syncLatestBaselineKeepDraft(); }
  catch(err){ console.error(err); publishProgress(`同步失敗：${err.message}`,'error'); setStatus(`同步失敗：${err.message}`); }
  finally{ btn.disabled=false; }
});
$('#btnOpenPreview').addEventListener('click',async()=>{
  const ok=await verifyPreviewNow();
  if(!ok) return;
  const snap=await dbGet(PREVIEW_SNAPSHOT_KEY);
  if(!snap) return;
  const url=latestPreviewUrl||`${location.origin}/preview/index.html?v=${Date.now()}`;
  window.open(url,'_blank','noopener');
  snap.viewedAt=Date.now();
  await dbPut(PREVIEW_SNAPSHOT_KEY,snap);
  const same=await snapshotStillMatchesDraft(snap);
  $('#btnPromote').disabled=!(same && snap.dirtyFiles?.length);
  if(same) setStatus('測試版已開啟。確認畫面正常後，可按「③ 套用正式網站」。');
  else setStatus('草稿已在測試版後變更，請重新發布測試版。');
});

/* ---------- leave-page safety ---------- */
window.addEventListener('pagehide',()=>{
  try{ if(hasLoadedPage) captureCurrentPage(); }catch{}
  persistDraftMap({silent:true}).catch(()=>{});
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
      $('#btnPromote').disabled=true;
    }
    await loadPage('index.html');
    setStatus(`${BUILD} 已完成啟動。GitHub 版本變更時可保留草稿並安全同步基準。`);
  }catch(err){
    console.error(err); setStatus(`啟動失敗：${err.message}`);
  }
})();
})();