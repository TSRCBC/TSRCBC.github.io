
(() => {
  'use strict';

  const CFG = window.CHINON_CONFIG;
  const $ = (s) => document.querySelector(s);
  const statusText = $('#statusText');
  const STORAGE_KEY = 'chinon-wixlike-v5';
  const INIT_KEY = 'chinon-wixlike-v5-init';
  const SNAPSHOT_ATTR = 'data-chinon-move-snapshot';

  const editor = grapesjs.init({
    container: '#gjs',
    height: '100%',
    width: 'auto',
    fromElement: false,

    storageManager: {
      type: 'local',
      autosave: true,
      autoload: true,
      stepsBeforeSave: 1,
      options: { local: { key: STORAGE_KEY } }
    },

    deviceManager: {
      devices: [
        { id: 'Desktop', name: 'Desktop', width: '' },
        { id: 'Tablet', name: 'Tablet', width: '820px', widthMedia: '980px' },
        { id: 'Mobile', name: 'Mobile', width: '390px', widthMedia: '600px' }
      ]
    },

    canvas: { styles: [CFG.fontUrl] },

    selectorManager: { componentFirst: true },

    styleManager: {
      sectors: [
        {
          name: '位置／尺寸',
          open: true,
          buildProps: [
            'position','top','right','bottom','left','z-index',
            'width','height','min-width','min-height','max-width','max-height',
            'display','overflow','transform'
          ]
        },
        {
          name: '文字',
          open: true,
          properties: [
            {
              property: 'font-family',
              name: '字型',
              type: 'select',
              options: [
                { id: '"Noto Sans TC", sans-serif', label: 'TW｜思源黑體' },
                { id: '"Noto Serif TC", serif', label: 'TW｜思源宋體' },
                { id: '"LXGW WenKai TC", serif', label: 'TW｜霞鶩文楷' },
                { id: '"Iansui", cursive', label: 'TW｜芫荽體' },
                { id: '"Klee One", cursive', label: 'TW｜Klee 手寫' },
                { id: '"Zen Kurenaido", cursive', label: 'TW｜Zen 手寫' },
                { id: '"Yuji Syuku", serif', label: 'TW｜Yuji 書寫' },
                { id: 'Arial, sans-serif', label: 'Arial' },
                { id: '"Times New Roman", serif', label: 'Times New Roman' }
              ]
            },
            { property: 'font-size', name: '字體大小' },
            { property: 'font-weight', name: '粗細' },
            { property: 'font-style', name: '斜體' },
            { property: 'text-decoration', name: '文字裝飾' },
            { property: 'line-height', name: '行高' },
            { property: 'letter-spacing', name: '字距' },
            { property: 'color', name: '文字顏色' },
            { property: 'text-align', name: '對齊' },
            { property: 'text-shadow', name: '文字陰影', type: 'text' }
          ]
        },
        {
          name: '間距',
          open: false,
          buildProps: [
            'margin-top','margin-right','margin-bottom','margin-left',
            'padding-top','padding-right','padding-bottom','padding-left'
          ]
        },
        {
          name: '背景／外觀',
          open: false,
          buildProps: [
            'background-color','background-image','background-position','background-size','background-repeat',
            'border-top-width','border-right-width','border-bottom-width','border-left-width',
            'border-style','border-color','border-radius',
            'opacity'
          ],
          properties: [
            { property: 'box-shadow', name: '區塊陰影', type: 'text' }
          ]
        },
        {
          name: 'Flex / Grid',
          open: false,
          buildProps: [
            'flex-direction','flex-wrap','justify-content','align-items','align-content',
            'gap','grid-template-columns','grid-template-rows'
          ]
        }
      ]
    }
  });

  function setStatus(msg) { statusText.textContent = msg; }

  function selectedOrWarn() {
    const c = editor.getSelected();
    if (!c) {
      alert('請先點選一個文字、圖片、按鈕或區塊。');
      return null;
    }
    return c;
  }

  function currentPage() { return editor.Pages.getSelected(); }

  function currentRoot() {
    return currentPage()?.getMainComponent?.() || editor.getWrapper();
  }

  function selectedContainerOrRoot() {
    const c = editor.getSelected();
    if (c) {
      const tag = String(c.get('tagName') || '').toLowerCase();
      if (['body','main','section','div','article','header','footer','nav'].includes(tag)) return c;
      if (c.parent?.()) return c.parent();
    }
    return currentRoot();
  }

  function append(def, msg) {
    const target = selectedContainerOrRoot();
    const added = target.append(def);
    const c = Array.isArray(added) ? added[0] : added;
    if (c) editor.select(c);
    setStatus(msg);
    return c;
  }

  function sanitizeSlug(value) {
    const v = String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\.html$/i, '')
      .replace(/[^a-z0-9\u4e00-\u9fff_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return v || `page-${Date.now()}`;
  }

  function pageFile(page) {
    return page?.get('chinonFile') || 'index.html';
  }

  function refreshPages() {
    const sel = $('#pageSelect');
    sel.innerHTML = '';
    editor.Pages.getAll().forEach((p) => {
      const opt = document.createElement('option');
      opt.value = pageFile(p);
      opt.textContent = p.get('name') || pageFile(p);
      sel.appendChild(opt);
    });
    sel.value = pageFile(currentPage());
  }

  function ensureMoveSnapshot(c) {
    const attrs = c.getAttributes?.() || {};
    if (attrs[SNAPSHOT_ATTR]) return;
    const s = c.getStyle?.() || {};
    const snap = {};
    ['position','top','right','bottom','left','z-index','transform'].forEach(k => {
      snap[k] = Object.prototype.hasOwnProperty.call(s, k) ? s[k] : null;
    });
    c.addAttributes({ [SNAPSHOT_ATTR]: encodeURIComponent(JSON.stringify(snap)) });
  }

  function restoreMove() {
    const c = selectedOrWarn();
    if (!c) return;
    const attrs = c.getAttributes?.() || {};
    if (!attrs[SNAPSHOT_ATTR]) {
      setStatus('這個元件沒有移動前的紀錄。');
      return;
    }
    const snap = JSON.parse(decodeURIComponent(attrs[SNAPSHOT_ATTR]));
    const style = { ...(c.getStyle?.() || {}) };
    Object.entries(snap).forEach(([k,v]) => {
      if (v === null || v === '') delete style[k];
      else style[k] = v;
    });
    c.setStyle(style);
    c.removeAttributes(SNAPSHOT_ATTR);
    setStatus('已恢復第一次移動前的位置。');
  }

  // -------- precise free move --------
  let moveState = { cleanup: null, component: null, oldDraggable: null };

  function stopMove(msg='') {
    if (moveState.cleanup) try { moveState.cleanup(); } catch {}
    if (moveState.component) {
      try { moveState.component.set('draggable', moveState.oldDraggable); } catch {}
    }
    moveState = { cleanup:null, component:null, oldDraggable:null };
    $('#btnPixelMove').classList.remove('mode-active');
    if (msg) setStatus(msg);
  }

  function numberPx(v) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }

  function armMove() {
    const c = selectedOrWarn();
    if (!c) return;

    stopMove();
    ensureMoveSnapshot(c);

    const el = c.getEl?.();
    const doc = editor.Canvas.getDocument?.();
    if (!el || !doc) return;

    const oldDraggable = c.get('draggable');
    c.set('draggable', false);
    moveState.component = c;
    moveState.oldDraggable = oldDraggable;
    $('#btnPixelMove').classList.add('mode-active');
    setStatus('自由移動已準備：再直接抓住選取的物件拖到你要的位置。');

    let dragging = false;
    let sx=0, sy=0, bl=0, bt=0, pos='static';

    const down = (ev) => {
      if (!(ev.target === el || el.contains(ev.target))) return;
      ev.preventDefault(); ev.stopPropagation();
      dragging = true;
      sx = ev.clientX; sy = ev.clientY;
      const ms = c.getStyle?.() || {};
      const cs = doc.defaultView.getComputedStyle(el);
      pos = ms.position || cs.position || 'static';
      bl = numberPx(ms.left || cs.left);
      bt = numberPx(ms.top || cs.top);
      el.style.position = pos !== 'static' ? pos : 'relative';
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
    };

    const move = (ev) => {
      if (!dragging) return;
      ev.preventDefault(); ev.stopPropagation();
      const left = Math.round(bl + ev.clientX - sx);
      const top = Math.round(bt + ev.clientY - sy);
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
      setStatus(`位置：Left ${left}px / Top ${top}px`);
    };

    const up = (ev) => {
      if (!dragging) return;
      ev.preventDefault(); ev.stopPropagation();
      dragging = false;
      const left = Math.round(numberPx(el.style.left));
      const top = Math.round(numberPx(el.style.top));
      c.addStyle({
        position: pos !== 'static' ? pos : 'relative',
        left: `${left}px`,
        top: `${top}px`
      });
      el.style.cursor = '';
      el.style.userSelect = '';
      stopMove(`已移動到 Left ${left}px / Top ${top}px。`);
    };

    doc.addEventListener('pointerdown', down, true);
    doc.addEventListener('pointermove', move, true);
    doc.addEventListener('pointerup', up, true);
    doc.addEventListener('pointercancel', up, true);

    moveState.cleanup = () => {
      doc.removeEventListener('pointerdown', down, true);
      doc.removeEventListener('pointermove', move, true);
      doc.removeEventListener('pointerup', up, true);
      doc.removeEventListener('pointercancel', up, true);
      el.style.cursor=''; el.style.userSelect='';
    };
  }

  function changeLayer(delta, top=false) {
    const c = selectedOrWarn(); if (!c) return;
    ensureMoveSnapshot(c);
    const s = c.getStyle?.() || {};
    let z = parseInt(s['z-index'], 10);
    if (!Number.isFinite(z)) z = 1;
    z = top ? 999 : Math.max(0, z + delta);
    c.addStyle({ position: s.position || 'relative', 'z-index': String(z) });
    setStatus(`圖層 z-index = ${z}`);
  }

  // -------- add components --------
  function addText() {
    append({
      tagName:'p',
      content:'雙擊這裡修改文字',
      style:{fontSize:'18px',lineHeight:'1.8',margin:'16px 0'}
    }, '已新增文字。雙擊即可修改。');
  }

  function addHeading() {
    append({
      tagName:'h2',
      content:'新的標題',
      style:{fontSize:'42px',lineHeight:'1.2',margin:'20px 0'}
    }, '已新增標題。');
  }

  function addButton() {
    append({
      tagName:'a',
      attributes:{href:'#'},
      content:'按鈕文字',
      style:{
        display:'inline-flex',padding:'12px 22px',borderRadius:'999px',
        background:'#163b29',color:'#fff',textDecoration:'none',fontWeight:'700'
      }
    }, '已新增按鈕。可用「超連結」修改網址。');
  }

  function addLinkText() {
    append({
      tagName:'a',
      attributes:{href:'#'},
      content:'連結文字',
      style:{color:'#165bd8',textDecoration:'underline',fontSize:'18px'}
    }, '已新增連結文字。');
  }

  function addSection() {
    append({
      tagName:'section',
      style:{
        position:'relative',minHeight:'280px',padding:'48px',margin:'18px 0',
        background:'#fffdf8',border:'1px solid rgba(22,59,41,.14)',borderRadius:'20px'
      },
      components:[
        {tagName:'h2',content:'新的區塊',style:{margin:'0 0 10px',fontSize:'36px'}},
        {tagName:'p',content:'雙擊這裡修改內容。',style:{margin:'0'}}
      ]
    }, '已新增區塊。');
  }

  function addColumns(count) {
    const comps = [];
    for (let i=0;i<count;i++) {
      comps.push({
        tagName:'div',
        style:{padding:'28px',background:'#fffdf8',minHeight:'180px',border:'1px solid rgba(22,59,41,.10)'},
        components:[{tagName:'p',content:`第 ${i+1} 欄內容`}]
      });
    }
    append({
      tagName:'section',
      style:{
        display:'grid',
        gridTemplateColumns:`repeat(${count}, minmax(0,1fr))`,
        gap:'20px',padding:'20px',margin:'18px 0'
      },
      components:comps
    }, `已新增 ${count} 欄版面。`);
  }

  function addDivider() {
    append({tagName:'hr',style:{border:'0',borderTop:'1px solid rgba(22,59,41,.2)',margin:'32px 0'}}, '已新增分隔線。');
  }

  function addSpacer() {
    append({tagName:'div',style:{height:'80px'}}, '已新增 80px 留白。');
  }

  function addShape() {
    append({
      tagName:'div',
      style:{
        width:'160px',height:'160px',background:'#d9d1b8',borderRadius:'24px',margin:'18px 0'
      }
    }, '已新增圖形。右側可改顏色、大小、圓角。');
  }

  function addVideo() {
    const url = prompt('貼上 YouTube 網址：');
    if (!url) return;
    let id = '';
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) id = u.pathname.slice(1);
      else id = u.searchParams.get('v') || '';
    } catch {}
    if (!id) {
      alert('目前支援 YouTube 網址。');
      return;
    }
    append({
      tagName:'iframe',
      attributes:{
        src:`https://www.youtube.com/embed/${id}`,
        allow:'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
        allowfullscreen:'true'
      },
      style:{width:'640px',maxWidth:'100%',height:'360px',border:'0',margin:'18px 0'}
    }, '已新增 YouTube 影片。');
  }

  function fileToDataUrl(file, cb) {
    const r = new FileReader();
    r.onload = () => cb(r.result);
    r.readAsDataURL(file);
  }

  function addImageFile(file) {
    if (!file) return;
    fileToDataUrl(file, (src) => {
      append({
        tagName:'img',
        attributes:{src,alt:file.name.replace(/\.[^.]+$/,'')},
        style:{display:'block',width:'420px',maxWidth:'100%',height:'auto',margin:'18px 0',objectFit:'cover'}
      }, `已加入圖片：${file.name}`);
    });
  }

  function replaceImageFile(file) {
    const c = selectedOrWarn(); if (!c || !file) return;
    const tag = String(c.get('tagName') || '').toLowerCase();
    if (tag !== 'img') {
      alert('請先選取一張圖片。');
      return;
    }
    fileToDataUrl(file, (src) => {
      c.addAttributes({src,alt:file.name.replace(/\.[^.]+$/,'')});
      setStatus('圖片已更換。');
    });
  }

  function setBackgroundImageFile(file) {
    const c = selectedOrWarn(); if (!c || !file) return;
    fileToDataUrl(file, (src) => {
      c.addStyle({
        backgroundImage:`url("${src}")`,
        backgroundSize:'cover',
        backgroundPosition:'center',
        backgroundRepeat:'no-repeat'
      });
      setStatus('背景圖片已套用。');
    });
  }

  // -------- links --------
  function selectedLinkTarget() {
    const c = selectedOrWarn();
    if (!c) return null;
    if (String(c.get('tagName') || '').toLowerCase() === 'a') return c;
    const p = c.parent?.();
    if (p && String(p.get('tagName') || '').toLowerCase() === 'a') return p;
    return c;
  }

  function openLinkDialog() {
    const c = selectedLinkTarget();
    if (!c) return;
    const attrs = c.getAttributes?.() || {};
    $('#linkUrl').value = attrs.href || '';
    $('#linkBlank').checked = attrs.target === '_blank';
    $('#linkDialog').showModal();
  }

  function applyLink() {
    let c = selectedLinkTarget();
    if (!c) return;
    const href = $('#linkUrl').value.trim() || '#';
    const target = $('#linkBlank').checked ? '_blank' : null;
    const tag = String(c.get('tagName') || '').toLowerCase();

    if (tag === 'a') {
      const attrs = {...(c.getAttributes?.()||{}), href};
      if (target) attrs.target = target; else delete attrs.target;
      c.setAttributes(attrs);
      setStatus('連結已更新。');
      return;
    }

    const parent = c.parent?.();
    if (!parent) return;
    const collection = parent.components();
    const index = collection.models.indexOf(c);
    const inner = editor.getHtml({component:c});
    c.remove();
    const html = `<a href="${href.replaceAll('"','&quot;')}"${target ? ' target="_blank" rel="noopener"' : ''} style="display:inline-block;color:inherit;text-decoration:inherit">${inner}</a>`;
    const added = collection.add(html, {at:index});
    editor.select(Array.isArray(added) ? added[0] : added);
    setStatus('已把選取物件設定成超連結。');
  }

  function unlinkSelected() {
    const c0 = selectedOrWarn(); if (!c0) return;
    let c = c0;
    if (String(c.get('tagName')||'').toLowerCase() !== 'a') {
      const p = c.parent?.();
      if (!p || String(p.get('tagName')||'').toLowerCase() !== 'a') {
        setStatus('目前選取物件沒有外層超連結。');
        return;
      }
      c = p;
    }
    const parent = c.parent?.();
    if (!parent) return;
    const collection = parent.components();
    const index = collection.models.indexOf(c);
    const inner = c.components().map(ch => editor.getHtml({component:ch})).join('') || c.get('content') || '';
    c.remove();
    const added = collection.add(inner, {at:index});
    const first = Array.isArray(added) ? added[0] : added;
    if (first) editor.select(first);
    setStatus('已移除超連結。');
  }

  // -------- duplicate/delete/resize --------
  function duplicateSelected() {
    const c = selectedOrWarn(); if (!c) return;
    const p = c.parent?.(); if (!p) return;
    const col = p.components();
    const idx = col.models.indexOf(c);
    const clone = c.clone();
    col.add(clone, {at:idx+1});
    editor.select(clone);
    setStatus('已複製元件。');
  }

  function deleteSelected() {
    const c = selectedOrWarn(); if (!c) return;
    if (confirm('刪除目前選取的元件？')) {
      c.remove();
      setStatus('已刪除元件。');
    }
  }

  function enableResize() {
    const c = selectedOrWarn(); if (!c) return;
    c.set('resizable', true);
    editor.refresh();
    setStatus('已開啟縮放控制點；拖曳元件邊緣/角落調整大小。');
  }

  // -------- quick style --------
  function openQuickStyle() {
    if (!selectedOrWarn()) return;
    $('#quickStyleDialog').showModal();
  }

  function applyQuickStyle() {
    const c = selectedOrWarn(); if (!c) return;
    const s = {};
    const font = $('#quickFont').value;
    const fs = $('#quickFontSize').value;
    const radius = $('#quickRadius').value;
    const opacity = $('#quickOpacity').value;
    const align = $('#quickAlign').value;
    const shadow = $('#quickShadow').value;

    if (font) s.fontFamily = font;
    if (fs) s.fontSize = `${fs}px`;
    if ($('#quickColor').value) s.color = $('#quickColor').value;
    if ($('#quickBg').value) s.backgroundColor = $('#quickBg').value;
    if (radius !== '') s.borderRadius = `${radius}px`;
    if (opacity !== '') s.opacity = String(Math.max(0,Math.min(100,Number(opacity)))/100);
    if (align) s.textAlign = align;
    if (shadow) {
      const tag = String(c.get('tagName')||'').toLowerCase();
      if (['p','span','h1','h2','h3','h4','h5','h6','a','strong'].includes(tag)) s.textShadow = shadow;
      else s.boxShadow = shadow;
    }
    c.addStyle(s);
    setStatus('快速樣式已套用。');
  }

  function toggleTextStyle(prop, onValue, offValue='normal') {
    const c = selectedOrWarn(); if (!c) return;
    const s = c.getStyle?.() || {};
    c.addStyle({[prop]: s[prop] === onValue ? offValue : onValue});
  }

  // -------- page tools --------
  function addPage() {
    const name = prompt('新頁面名稱：', '新頁面');
    if (!name) return;
    const raw = prompt('網址檔名（例如 about）：', sanitizeSlug(name));
    if (!raw) return;
    let file = `${sanitizeSlug(raw)}.html`;
    if (editor.Pages.getAll().some(p => pageFile(p) === file)) {
      alert('這個檔名已經存在。');
      return;
    }
    const page = editor.Pages.add({
      name,
      chinonFile:file,
      component:`<main style="min-height:100vh;padding:60px"><h1>${name}</h1><p>雙擊修改內容，或用上方工具新增元件。</p></main>`
    });
    editor.Pages.select(page);
    refreshPages();
    setStatus(`已新增頁面：${name} (${file})`);
  }

  function renamePage() {
    const p = currentPage(); if (!p) return;
    const name = prompt('頁面名稱：', p.get('name') || '');
    if (!name) return;
    p.set('name', name);
    if (pageFile(p) !== 'index.html') {
      const fileRaw = prompt('網址檔名：', pageFile(p).replace(/\.html$/,''));
      if (fileRaw) p.set('chinonFile', `${sanitizeSlug(fileRaw)}.html`);
    }
    refreshPages();
    setStatus('頁面名稱已更新。');
  }

  function deletePage() {
    const p = currentPage(); if (!p) return;
    if (pageFile(p) === 'index.html') {
      alert('首頁不能刪除。');
      return;
    }
    if (!confirm(`刪除頁面「${p.get('name')}」？`)) return;
    editor.Pages.remove(p);
    editor.Pages.select(editor.Pages.getAll()[0]);
    refreshPages();
    setStatus('頁面已刪除。');
  }

  // -------- load/reload --------
  async function fetchText(url) {
    const r = await fetch(url, {cache:'no-store'});
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return await r.text();
  }

  async function loadLive({ask=true}={}) {
    if (ask && !confirm('重新載入會用 GitHub Pages 上的正式首頁覆蓋目前瀏覽器內的編輯內容。繼續？')) return;
    setStatus('正在載入正式網站…');

    let body = CFG.fallbackBody;
    let css = CFG.fallbackCss;
    try {
      const html = await fetchText(`../index.html?t=${Date.now()}`);
      const doc = new DOMParser().parseFromString(html,'text/html');
      doc.querySelectorAll('script').forEach(el=>el.remove());
      body = doc.body?.innerHTML || body;
    } catch {}
    try {
      css = await fetchText(`../styles.css?t=${Date.now()}`);
    } catch {}

    const pm = editor.Pages;
    [...pm.getAll()].slice(1).forEach(p=>pm.remove(p));
    const first = pm.getAll()[0] || pm.add({name:'首頁',component:''});
    first.set('name','首頁');
    first.set('chinonFile','index.html');
    pm.select(first);
    editor.setComponents(body);
    editor.setStyle(css);
    localStorage.setItem(INIT_KEY,'1');
    await editor.store();
    editor.clearDirtyCount();
    refreshPages();
    setStatus('正式首頁已載入。');
  }

  // -------- code --------
  function openCode() {
    const p = currentPage();
    const root = p?.getMainComponent?.();
    $('#htmlCode').value = root ? editor.getHtml({component:root}) : editor.getHtml();
    $('#cssCode').value = editor.getCss();
    $('#codeDialog').showModal();
  }

  function applyCode() {
    editor.setComponents($('#htmlCode').value);
    editor.setStyle($('#cssCode').value);
    $('#codeDialog').close();
    setStatus('HTML / CSS 已套用。');
  }

  async function copyText(text,label) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(`${label} 已複製。`);
    } catch {
      alert('請在文字框 Ctrl+A → Ctrl+C 複製。');
    }
  }

  // -------- export --------
  function cleanSnapshotAttrs(html) {
    const d = new DOMParser().parseFromString(`<body>${html}</body>`,'text/html');
    d.body.querySelectorAll(`[${SNAPSHOT_ATTR}]`).forEach(el=>el.removeAttribute(SNAPSHOT_ATTR));
    return d.body.innerHTML;
  }

  function docForPage(page, bodyHtml) {
    const title = page.get('name') || 'CHINON 奇農';
    return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
${bodyHtml}
<script src="main.js"></script>
</body>
</html>`;
  }

  function extFromMime(mime) {
    if (mime.includes('png')) return 'png';
    if (mime.includes('webp')) return 'webp';
    if (mime.includes('gif')) return 'gif';
    if (mime.includes('svg')) return 'svg';
    return 'jpg';
  }

  async function exportZip() {
    setStatus('正在建立網站 ZIP…');
    const zip = new JSZip();
    const assetFolder = zip.folder('assets').folder('uploads');
    let imgCounter = 1;

    for (const page of editor.Pages.getAll()) {
      const root = page.getMainComponent();
      let html = cleanSnapshotAttrs(editor.getHtml({component:root}));
      const doc = new DOMParser().parseFromString(`<body>${html}</body>`,'text/html');

      for (const img of [...doc.body.querySelectorAll('img[src^="data:"]')]) {
        const src = img.getAttribute('src');
        const m = src.match(/^data:([^;]+);base64,(.+)$/);
        if (!m) continue;
        const ext = extFromMime(m[1]);
        const name = `image-${imgCounter++}.${ext}`;
        assetFolder.file(name, m[2], {base64:true});
        img.setAttribute('src', `assets/uploads/${name}`);
      }

      html = doc.body.innerHTML;
      zip.file(pageFile(page), docForPage(page, html));
    }

    let css = editor.getCss() || '';
    if (!css.includes('fonts.googleapis.com')) {
      css = `@import url('${CFG.fontUrl}');\n\n` + css;
    }
    zip.file('styles.css', css);
    zip.file('main.js', '// CHINON site script\n');
    zip.file('editor-backup.json', JSON.stringify(editor.getProjectData(),null,2));
    zip.file('上傳說明.txt',
`把 ZIP 解壓後，將網站檔案上傳到 TSRCBC.github.io 根目錄並覆蓋舊檔。

會包含：
- index.html
- 你新增的其他 .html 頁面
- styles.css
- main.js
- assets/uploads/（你從編輯器上傳的圖片）
- editor-backup.json（備份，不一定要公開）

請保留 GitHub 上的 editor/ 資料夾，這樣你的編輯器網址才會繼續存在。
`);

    const blob = await zip.generateAsync({type:'blob'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chinon-site-${new Date().toISOString().slice(0,10)}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus('網站 ZIP 已下載。');
  }

  // -------- wire UI --------
  $('#btnAddText').addEventListener('click',addText);
  $('#btnAddHeading').addEventListener('click',addHeading);
  $('#btnAddButton').addEventListener('click',addButton);
  $('#btnAddLinkText').addEventListener('click',addLinkText);
  $('#btnAddSection').addEventListener('click',addSection);
  $('#btnAddColumns').addEventListener('click',()=>addColumns(2));
  $('#btnAddThreeColumns').addEventListener('click',()=>addColumns(3));
  $('#btnAddDivider').addEventListener('click',addDivider);
  $('#btnAddSpacer').addEventListener('click',addSpacer);
  $('#btnAddShape').addEventListener('click',addShape);
  $('#btnAddVideo').addEventListener('click',addVideo);

  $('#btnAddImage').addEventListener('click',()=>$('#imagePicker').click());
  $('#imagePicker').addEventListener('change',(e)=>{ addImageFile(e.target.files?.[0]); e.target.value=''; });

  $('#btnReplaceImage').addEventListener('click',()=>$('#replaceImagePicker').click());
  $('#replaceImagePicker').addEventListener('change',(e)=>{ replaceImageFile(e.target.files?.[0]); e.target.value=''; });

  $('#btnBackgroundImage').addEventListener('click',()=>$('#backgroundImagePicker').click());
  $('#backgroundImagePicker').addEventListener('change',(e)=>{ setBackgroundImageFile(e.target.files?.[0]); e.target.value=''; });

  $('#btnPixelMove').addEventListener('click',armMove);
  $('#btnResetMove').addEventListener('click',restoreMove);
  $('#btnLayerUp').addEventListener('click',()=>changeLayer(1));
  $('#btnLayerDown').addEventListener('click',()=>changeLayer(-1));
  $('#btnLayerTop').addEventListener('click',()=>changeLayer(0,true));
  $('#btnResize').addEventListener('click',enableResize);
  $('#btnDuplicate').addEventListener('click',duplicateSelected);
  $('#btnDelete').addEventListener('click',deleteSelected);

  $('#btnLink').addEventListener('click',openLinkDialog);
  $('#btnApplyLink').addEventListener('click',(e)=>{ e.preventDefault(); applyLink(); $('#linkDialog').close(); });
  $('#btnUnlink').addEventListener('click',unlinkSelected);

  $('#btnQuickStyle').addEventListener('click',openQuickStyle);
  $('#btnApplyQuickStyle').addEventListener('click',(e)=>{ e.preventDefault(); applyQuickStyle(); $('#quickStyleDialog').close(); });
  $('#quickBold').addEventListener('click',()=>toggleTextStyle('font-weight','700','400'));
  $('#quickItalic').addEventListener('click',()=>toggleTextStyle('font-style','italic','normal'));
  $('#quickUnderline').addEventListener('click',()=>toggleTextStyle('text-decoration','underline','none'));

  $('#btnAddPage').addEventListener('click',addPage);
  $('#btnRenamePage').addEventListener('click',renamePage);
  $('#btnDeletePage').addEventListener('click',deletePage);
  $('#pageSelect').addEventListener('change',(e)=>{
    const p = editor.Pages.getAll().find(x=>pageFile(x)===e.target.value);
    if (p) editor.Pages.select(p);
  });

  $('#btnUndo').addEventListener('click',()=>editor.UndoManager.undo());
  $('#btnRedo').addEventListener('click',()=>editor.UndoManager.redo());

  $('#btnCode').addEventListener('click',openCode);
  $('#btnCloseCode').addEventListener('click',()=>$('#codeDialog').close());
  $('#btnApplyCode').addEventListener('click',applyCode);
  $('#btnCopyHtml').addEventListener('click',()=>copyText($('#htmlCode').value,'HTML'));
  $('#btnCopyCss').addEventListener('click',()=>copyText($('#cssCode').value,'CSS'));

  $('#btnSave').addEventListener('click',async()=>{
    await editor.store();
    editor.clearDirtyCount();
    setStatus('已儲存在這台瀏覽器。');
  });

  $('#btnReload').addEventListener('click',()=>loadLive({ask:true}));
  $('#btnExport').addEventListener('click',exportZip);

  document.querySelectorAll('[data-device]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      editor.setDevice(btn.dataset.device);
      setStatus(`預覽：${btn.textContent}`);
    });
  });

  editor.on('page:select',refreshPages);
  editor.on('component:selected',(c)=>{
    if (moveState.component && moveState.component !== c) stopMove();
    const name = c.getName?.() || c.get('tagName') || '元件';
    setStatus(`已選取：${name}。可改樣式、超連結、圖片、移動、複製或刪除。`);
  });

  editor.on('load',async()=>{
    if (!localStorage.getItem(INIT_KEY)) {
      await loadLive({ask:false});
      localStorage.setItem(INIT_KEY,'1');
    }
    refreshPages();
    setStatus('編輯器已就緒。雙擊文字可直接修改。');
  });
})();
