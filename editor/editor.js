
(() => {
  'use strict';

  const CFG = window.CHINON_CONFIG;
  const $ = (s) => document.querySelector(s);
  const statusText = $('#statusText');
  const STORAGE_KEY = 'chinon-warm-v72';
  const INIT_KEY = 'chinon-warm-v72-init';
  const SNAPSHOT_ATTR = 'data-chinon-move-snapshot';
  const SITE_PAGES = [
    { file:'index.html', name:'首頁' },
    { file:'about.html', name:'關於奇農' },
    { file:'craft.html', name:'製茶堅持' },
    { file:'gaba.html', name:'GABA桑茶' },
    { file:'maca.html', name:'秘魯瑪卡' },
    { file:'certificates.html', name:'檢測證書' },
    { file:'info.html', name:'相關資訊' },
    { file:'contact.html', name:'聯繫我們' }
  ];

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
            {
              property: 'font-size',
              name: '字體大小',
              type: 'number',
              units: ['px', 'rem', 'em', '%', 'vw'],
              default: '16px',
              min: 6,
              max: 300
            },
            { property: 'font-weight', name: '粗細' },
            { property: 'font-style', name: '斜體' },
            { property: 'text-decoration', name: '文字裝飾' },
            {
              property: 'line-height',
              name: '行高',
              type: 'number',
              units: ['', 'px', 'em', 'rem', '%'],
              default: '1.4',
              min: 0.5,
              max: 10,
              step: 0.05
            },
            {
              property: 'letter-spacing',
              name: '字距',
              type: 'number',
              units: ['px', 'em', 'rem'],
              default: '0px',
              min: -20,
              max: 100,
              step: 0.1
            },
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

  // -------- V7.7 右側功能列繁體中文化 --------
  const PANEL_ZH = new Map([
    ['Classes', '類別'],
    ['Class', '類別'],
    ['Selected:', '已選取：'],
    ['Selected', '已選取'],
    ['Select an element before using Style Manager', '請先選取一個元素，再調整樣式'],
    ['Select an element before using the Style Manager', '請先選取一個元素，再調整樣式'],

    ['Position', '定位方式'],
    ['Top', '上'],
    ['Right', '右'],
    ['Bottom', '下'],
    ['Left', '左'],
    ['Z index', '圖層順序'],
    ['Z-index', '圖層順序'],
    ['Width', '寬度'],
    ['Height', '高度'],
    ['Min width', '最小寬度'],
    ['Min height', '最小高度'],
    ['Max width', '最大寬度'],
    ['Max height', '最大高度'],
    ['Display', '顯示方式'],
    ['Overflow', '超出內容'],
    ['Transform', '變形'],

    ['Font family', '字型'],
    ['Font size', '字體大小'],
    ['Font weight', '粗細'],
    ['Font style', '斜體'],
    ['Text decoration', '文字裝飾'],
    ['Line height', '行高'],
    ['Letter spacing', '字距'],
    ['Color', '文字顏色'],
    ['Text align', '對齊'],
    ['Text shadow', '文字陰影'],

    ['Margin top', '上外距'],
    ['Margin right', '右外距'],
    ['Margin bottom', '下外距'],
    ['Margin left', '左外距'],
    ['Padding top', '上內距'],
    ['Padding right', '右內距'],
    ['Padding bottom', '下內距'],
    ['Padding left', '左內距'],

    ['Background color', '背景顏色'],
    ['Background image', '背景圖片'],
    ['Background position', '背景位置'],
    ['Background size', '背景尺寸'],
    ['Background repeat', '背景重複'],
    ['Border top width', '上框線寬度'],
    ['Border right width', '右框線寬度'],
    ['Border bottom width', '下框線寬度'],
    ['Border left width', '左框線寬度'],
    ['Border style', '框線樣式'],
    ['Border color', '框線顏色'],
    ['Border radius', '圓角'],
    ['Opacity', '透明度'],
    ['Box shadow', '區塊陰影'],

    ['Flex direction', '排列方向'],
    ['Flex wrap', '換行方式'],
    ['Justify content', '主軸對齊'],
    ['Align items', '交叉軸對齊'],
    ['Align content', '多行對齊'],
    ['Gap', '項目間距'],
    ['Grid template columns', '網格欄設定'],
    ['Grid template rows', '網格列設定'],

    ['Device', '裝置'],
    ['Desktop', '桌機'],
    ['Tablet', '平板'],
    ['Mobile', '手機']
  ]);

  const OPTION_ZH = new Map([
    ['static', '靜態'],
    ['relative', '相對'],
    ['absolute', '絕對'],
    ['fixed', '固定'],
    ['sticky', '黏著'],

    ['block', '區塊'],
    ['inline', '行內'],
    ['inline-block', '行內區塊'],
    ['flex', '彈性排列'],
    ['inline-flex', '行內彈性排列'],
    ['grid', '網格排列'],
    ['inline-grid', '行內網格排列'],
    ['none', '無／隱藏'],

    ['visible', '顯示'],
    ['hidden', '隱藏'],
    ['scroll', '捲動'],
    ['auto', '自動'],

    ['normal', '一般'],
    ['bold', '粗體'],
    ['bolder', '較粗'],
    ['lighter', '較細'],
    ['italic', '斜體'],
    ['oblique', '傾斜'],
    ['underline', '底線'],
    ['overline', '上線'],
    ['line-through', '刪除線'],

    ['left', '靠左'],
    ['center', '置中'],
    ['right', '靠右'],
    ['justify', '左右對齊'],

    ['repeat', '重複'],
    ['no-repeat', '不重複'],
    ['repeat-x', '水平重複'],
    ['repeat-y', '垂直重複'],
    ['cover', '填滿裁切'],
    ['contain', '完整顯示'],

    ['solid', '實線'],
    ['dashed', '虛線'],
    ['dotted', '點線'],
    ['double', '雙線'],

    ['row', '橫向'],
    ['row-reverse', '橫向反轉'],
    ['column', '直向'],
    ['column-reverse', '直向反轉'],
    ['nowrap', '不換行'],
    ['wrap', '換行'],
    ['wrap-reverse', '反向換行'],

    ['flex-start', '靠開頭'],
    ['flex-end', '靠結尾'],
    ['space-between', '兩端分散'],
    ['space-around', '環繞分散'],
    ['space-evenly', '平均分散'],
    ['stretch', '拉伸'],
    ['baseline', '基準線']
  ]);

  function translatePanelText(root=document) {
    const scopes = [
      ...root.querySelectorAll?.('.gjs-sm-sectors, .gjs-clm-tags, .gjs-sm-sector, .gjs-sm-property, .gjs-field, .gjs-field-select') || []
    ];

    const targets = scopes.length ? scopes : [root];

    targets.forEach(scope => {
      const walker = document.createTreeWalker(
        scope,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node) {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            if (['SCRIPT','STYLE','TEXTAREA'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      const textNodes = [];
      let node;
      while ((node = walker.nextNode())) textNodes.push(node);

      textNodes.forEach(textNode => {
        const raw = textNode.nodeValue || '';
        const trimmed = raw.trim();
        if (!trimmed) return;

        let translated = PANEL_ZH.get(trimmed);

        if (!translated && trimmed.startsWith('Selected:')) {
          translated = trimmed.replace(/^Selected:/, '已選取：');
        }

        if (translated) {
          textNode.nodeValue = raw.replace(trimmed, translated);
        }
      });

      scope.querySelectorAll?.('option').forEach(option => {
        const raw = (option.textContent || '').trim();
        const value = (option.value || '').trim();
        const translated = OPTION_ZH.get(raw) || OPTION_ZH.get(value);
        if (translated) option.textContent = translated;
      });

      scope.querySelectorAll?.('input[placeholder]').forEach(input => {
        const p = input.getAttribute('placeholder');
        if (p && PANEL_ZH.has(p)) input.setAttribute('placeholder', PANEL_ZH.get(p));
      });

      scope.querySelectorAll?.('[title]').forEach(el => {
        const t = el.getAttribute('title');
        if (t && PANEL_ZH.has(t)) el.setAttribute('title', PANEL_ZH.get(t));
      });
    });
  }

  let panelZhObserver = null;

  function enableChineseRightPanel() {
    translatePanelText(document);

    if (panelZhObserver) return;

    panelZhObserver = new MutationObserver(() => {
      requestAnimationFrame(() => translatePanelText(document));
    });

    panelZhObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }


  let lastSiteCss = '';

  function siteRootUrl() {
    return new URL('../', window.location.href);
  }

  function toSiteRootAssetUrl(value) {
    if (!value) return value;
    const raw = String(value).trim();

    // 完整網址、data/blob/hash 不碰。
    if (/^(?:https?:|data:|blob:|mailto:|tel:|#|\/\/)/i.test(raw)) return raw;

    // 只把本站 assets 路徑固定到網站根目錄，避免 /editor/assets/。
    const cleaned = raw.replace(/^\.\//, '');
    if (cleaned.startsWith('assets/')) return '/' + cleaned;
    if (cleaned.startsWith('../assets/')) return '/' + cleaned.replace(/^\.\.\//, '');

    return raw;
  }

  function normalizeHtmlAssetPaths(doc) {
    if (!doc) return;

    doc.querySelectorAll('[src]').forEach(el => {
      const v = el.getAttribute('src');
      const n = toSiteRootAssetUrl(v);
      if (n !== v) el.setAttribute('src', n);
    });

    doc.querySelectorAll('[poster]').forEach(el => {
      const v = el.getAttribute('poster');
      const n = toSiteRootAssetUrl(v);
      if (n !== v) el.setAttribute('poster', n);
    });

    doc.querySelectorAll('[srcset]').forEach(el => {
      const srcset = el.getAttribute('srcset') || '';
      const normalized = srcset.split(',').map(part => {
        const bits = part.trim().split(/\s+/);
        if (!bits[0]) return part;
        bits[0] = toSiteRootAssetUrl(bits[0]);
        return bits.join(' ');
      }).join(', ');
      el.setAttribute('srcset', normalized);
    });

    doc.querySelectorAll('[style]').forEach(el => {
      const style = el.getAttribute('style') || '';
      const normalized = style.replace(
        /url\(\s*(['"]?)(?:\.\/|\.\.\/)?(assets\/[^)'"]+)\1\s*\)/gi,
        (_m, quote, path) => `url(${quote}/${path}${quote})`
      );
      if (normalized !== style) el.setAttribute('style', normalized);
    });
  }

  function normalizeCssAssetPaths(cssText) {
    return String(cssText || '').replace(
      /url\(\s*(['"]?)(?:\.\/|\.\.\/)?(assets\/[^)'"]+)\1\s*\)/gi,
      (_m, quote, path) => `url(${quote}/${path}${quote})`
    );
  }

  function applyRootVariables(cssText) {
    const doc = editor.Canvas.getDocument?.();
    if (!doc?.documentElement) return;

    // GrapesJS 的 CSS parser 對 :root custom properties 不一定穩定。
    // 直接把正式網站 :root 變數寫到 Canvas 的 documentElement，確保
    // var(--olive) 等在編輯器內與正式網站一致。
    const match = String(cssText || '').match(/:root\s*\{([\s\S]*?)\}/i);
    if (!match) return;

    const declarations = match[1].split(';');
    for (const declaration of declarations) {
      const idx = declaration.indexOf(':');
      if (idx < 0) continue;
      const name = declaration.slice(0, idx).trim();
      const value = declaration.slice(idx + 1).trim();
      if (name.startsWith('--') && value) {
        doc.documentElement.style.setProperty(name, value);
      }
    }
  }

  function ensureCanvasEnvironment() {
    const doc = editor.Canvas.getDocument?.();
    if (!doc || !doc.head) return;

    let base = doc.head.querySelector('base[data-chinon-editor-base]');
    if (!base) {
      base = doc.createElement('base');
      base.setAttribute('data-chinon-editor-base', '1');
      doc.head.insertBefore(base, doc.head.firstChild);
    }
    base.href = siteRootUrl().href;

    if (lastSiteCss) applyRootVariables(lastSiteCss);
  }

  // 保留舊函式名稱，讓既有程式碼仍可呼叫。
  function ensureCanvasBase() {
    ensureCanvasEnvironment();
  }


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

  // -------- V7.3 Canva-like text resize --------
  const TEXT_TAGS = new Set([
    'span','p','h1','h2','h3','h4','h5','h6',
    'a','button','strong','em','small','label','li'
  ]);

  let textResizeState = {
    component: null,
    overlay: null,
    cleanup: null
  };

  function textResizeTarget(component) {
    if (!component) return null;

    let target = component;
    let tag = String(target.get('tagName') || '').toLowerCase();

    // 如果點到 H1/H2/P 裡面的 Span/Strong，直接提升到外層文字框，
    // 使用者不用理解 HTML 階層。
    if (['span','strong','em','small'].includes(tag)) {
      const parent = target.parent?.();
      const parentTag = String(parent?.get('tagName') || '').toLowerCase();
      if (TEXT_TAGS.has(parentTag)) {
        target = parent;
        tag = parentTag;
      }
    }

    return TEXT_TAGS.has(tag) ? target : null;
  }

  function removeTextResizeOverlay(message='') {
    if (textResizeState.cleanup) {
      try { textResizeState.cleanup(); } catch {}
    }
    if (textResizeState.overlay?.remove) {
      try { textResizeState.overlay.remove(); } catch {}
    }

    textResizeState = { component:null, overlay:null, cleanup:null };
    $('#btnResize')?.classList.remove('mode-active');

    if (message) setStatus(message);
  }

  function ensureTextResizeCanvasStyle(doc) {
    if (doc.getElementById('chinon-canva-text-resize-style')) return;

    const style = doc.createElement('style');
    style.id = 'chinon-canva-text-resize-style';
    style.textContent = `
      .chinon-text-resize-box{
        position:fixed;
        z-index:2147483000;
        border:2px solid #7657ef;
        pointer-events:none;
        box-sizing:border-box;
      }
      .chinon-text-resize-handle{
        position:absolute;
        width:12px;
        height:12px;
        border-radius:50%;
        background:#fff;
        border:2px solid #7657ef;
        box-sizing:border-box;
        pointer-events:auto;
        touch-action:none;
      }
      .chinon-text-resize-handle[data-dir="nw"]{left:-7px;top:-7px;cursor:nwse-resize}
      .chinon-text-resize-handle[data-dir="ne"]{right:-7px;top:-7px;cursor:nesw-resize}
      .chinon-text-resize-handle[data-dir="sw"]{left:-7px;bottom:-7px;cursor:nesw-resize}
      .chinon-text-resize-handle[data-dir="se"]{right:-7px;bottom:-7px;cursor:nwse-resize}

      .chinon-text-resize-handle[data-dir="w"]{
        left:-6px;top:50%;transform:translateY(-50%);
        width:10px;height:22px;border-radius:6px;cursor:ew-resize;
      }
      .chinon-text-resize-handle[data-dir="e"]{
        right:-6px;top:50%;transform:translateY(-50%);
        width:10px;height:22px;border-radius:6px;cursor:ew-resize;
      }
      .chinon-text-size-badge{
        position:absolute;
        left:50%;
        top:-34px;
        transform:translateX(-50%);
        padding:4px 8px;
        border-radius:6px;
        background:#7657ef;
        color:#fff;
        font:600 11px/1.2 system-ui,-apple-system,sans-serif;
        white-space:nowrap;
        pointer-events:none;
        box-shadow:0 4px 14px rgba(0,0,0,.18);
      }
    `;
    doc.head.appendChild(style);
  }

  function openCanvaTextResize(component) {
    removeTextResizeOverlay();

    const target = textResizeTarget(component);
    if (!target) return false;

    if (target !== component) editor.select(target);

    const el = target.getEl?.();
    const doc = editor.Canvas.getDocument?.();
    const win = editor.Canvas.getWindow?.();

    if (!el || !doc || !win) {
      setStatus('目前文字框尚未準備完成，請重新點選文字後再按一次 Canva縮放。');
      return true;
    }

    ensureTextResizeCanvasStyle(doc);

    const overlay = doc.createElement('div');
    overlay.className = 'chinon-text-resize-box';

    const badge = doc.createElement('div');
    badge.className = 'chinon-text-size-badge';
    overlay.appendChild(badge);

    ['nw','ne','sw','se','w','e'].forEach(dir => {
      const handle = doc.createElement('div');
      handle.className = 'chinon-text-resize-handle';
      handle.dataset.dir = dir;
      overlay.appendChild(handle);
    });

    doc.body.appendChild(overlay);

    textResizeState.component = target;
    textResizeState.overlay = overlay;
    $('#btnResize')?.classList.add('mode-active');

    const updateOverlay = () => {
      if (!target.getEl?.() || !overlay.isConnected) return;

      const rect = target.getEl().getBoundingClientRect();
      const computed = win.getComputedStyle(target.getEl());
      const fontSize = Math.round(parseFloat(computed.fontSize) || 16);

      overlay.style.left = `${rect.left}px`;
      overlay.style.top = `${rect.top}px`;
      overlay.style.width = `${Math.max(2, rect.width)}px`;
      overlay.style.height = `${Math.max(2, rect.height)}px`;
      badge.textContent = `${fontSize}px`;
    };

    const listeners = [];

    const listen = (node, type, fn, opts) => {
      node.addEventListener(type, fn, opts);
      listeners.push(() => node.removeEventListener(type, fn, opts));
    };

    const beginResize = (ev) => {
      const handle = ev.target.closest?.('.chinon-text-resize-handle');
      if (!handle || !overlay.contains(handle)) return;

      ev.preventDefault();
      ev.stopPropagation();

      const dir = handle.dataset.dir;
      const element = target.getEl();
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const computed = win.getComputedStyle(element);

      const startFont = Math.max(6, parseFloat(computed.fontSize) || 16);
      const startWidth = Math.max(10, rect.width);
      const startHeight = Math.max(10, rect.height);

      // inline 元素要先變成 inline-block，width 才能像 Canva 文字框一樣調整。
      if (computed.display === 'inline') {
        target.addStyle({ display:'inline-block' });
      }

      const sx = ev.clientX;
      const sy = ev.clientY;

      const isCorner = ['nw','ne','sw','se'].includes(dir);

      let oppositeX = rect.left;
      let oppositeY = rect.top;

      if (dir === 'nw') { oppositeX = rect.right; oppositeY = rect.bottom; }
      if (dir === 'ne') { oppositeX = rect.left;  oppositeY = rect.bottom; }
      if (dir === 'sw') { oppositeX = rect.right; oppositeY = rect.top; }
      if (dir === 'se') { oppositeX = rect.left;  oppositeY = rect.top; }

      const startDistance = Math.max(
        20,
        Math.hypot(sx - oppositeX, sy - oppositeY)
      );

      const move = (moveEv) => {
        moveEv.preventDefault();
        moveEv.stopPropagation();

        if (isCorner) {
          // 四角：像 Canva 一樣整個文字框等比例縮放。
          const currentDistance = Math.max(
            5,
            Math.hypot(moveEv.clientX - oppositeX, moveEv.clientY - oppositeY)
          );

          const scale = Math.min(5, Math.max(.2, currentDistance / startDistance));
          const newFont = Math.min(220, Math.max(6, startFont * scale));
          const newWidth = Math.max(24, startWidth * scale);

          target.addStyle({
            'font-size': `${newFont.toFixed(1)}px`,
            'width': `${newWidth.toFixed(1)}px`
          });

          badge.textContent = `${Math.round(newFont)}px`;
          setStatus(`Canva縮放：字體 ${Math.round(newFont)}px`);
        } else {
          // 左右中點：只改文字框寬度，不改字體，讓文字自動換行。
          const dx = moveEv.clientX - sx;
          let newWidth = startWidth;

          if (dir === 'e') newWidth = startWidth + dx;
          if (dir === 'w') newWidth = startWidth - dx;

          newWidth = Math.max(40, newWidth);

          target.addStyle({
            'width': `${newWidth.toFixed(1)}px`
          });

          setStatus(`文字框寬度：${Math.round(newWidth)}px`);
        }

        editor.refresh();
        requestAnimationFrame(updateOverlay);
      };

      const end = (upEv) => {
        upEv.preventDefault();
        upEv.stopPropagation();
        doc.removeEventListener('pointermove', move, true);
        doc.removeEventListener('pointerup', end, true);
        doc.removeEventListener('pointercancel', end, true);
        editor.refresh();
        requestAnimationFrame(updateOverlay);
      };

      doc.addEventListener('pointermove', move, true);
      doc.addEventListener('pointerup', end, true);
      doc.addEventListener('pointercancel', end, true);
    };

    listen(overlay, 'pointerdown', beginResize, true);
    listen(win, 'resize', updateOverlay);
    listen(doc, 'scroll', updateOverlay, true);

    textResizeState.cleanup = () => {
      listeners.forEach(fn => {
        try { fn(); } catch {}
      });
    };

    updateOverlay();
    setStatus('文字縮放框已開啟：直接拖四角放大/縮小字體；拖左右把手只改文字框寬度。');
    return true;
  }

  function enableResize() {
    const c = selectedOrWarn();
    if (!c) return;

    // 文字元件：使用自製 Canva 式縮放框。
    if (openCanvaTextResize(c)) return;

    // 圖片、區塊等非文字元件：保留 GrapesJS 原生尺寸縮放。
    removeTextResizeOverlay();
    c.set('resizable', true);
    editor.refresh();
    setStatus('已開啟一般縮放：拖曳元件邊緣／角落調整圖片或區塊大小。');
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

    if (font) s['font-family'] = font;
    if (fs) s['font-size'] = `${fs}px`;
    if ($('#quickColor').value) s.color = $('#quickColor').value;
    if ($('#quickBg').value) s['background-color'] = $('#quickBg').value;
    if (radius !== '') s['border-radius'] = `${radius}px`;
    if (opacity !== '') s.opacity = String(Math.max(0,Math.min(100,Number(opacity)))/100);
    if (align) s['text-align'] = align;
    if (shadow) {
      const tag = String(c.get('tagName')||'').toLowerCase();
      if (['p','span','h1','h2','h3','h4','h5','h6','a','strong'].includes(tag)) s['text-shadow'] = shadow;
      else s['box-shadow'] = shadow;
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
    ensureCanvasBase();
    if (ask && !confirm('重新載入會用 GitHub Pages 上的正式網站覆蓋目前瀏覽器內的編輯內容。繼續？')) return;
    setStatus('正在載入完整網站…');

    let css = CFG.fallbackCss;
    try {
      css = await fetchText(`../styles.css?t=${Date.now()}`);
    } catch {}
    css = normalizeCssAssetPaths(css);
    lastSiteCss = css;

    const loaded = [];
    for (const item of SITE_PAGES) {
      try {
        const source = await fetchText(`../${item.file}?t=${Date.now()}`);
        const doc = new DOMParser().parseFromString(source,'text/html');
        doc.querySelectorAll('script').forEach(el=>el.remove());
        doc.querySelectorAll('link[rel="stylesheet"]').forEach(el=>el.remove());
        normalizeHtmlAssetPaths(doc);
        loaded.push({ ...item, body: doc.body?.innerHTML || '' });
      } catch {
        if (item.file === 'index.html') loaded.push({ ...item, body: CFG.fallbackBody });
      }
    }

    const pm = editor.Pages;
    const existing = [...pm.getAll()];
    const first = existing[0] || pm.add({name:'首頁',component:''});
    existing.slice(1).forEach(p=>pm.remove(p));

    const firstData = loaded[0] || {file:'index.html',name:'首頁',body:CFG.fallbackBody};
    first.set('name',firstData.name);
    first.set('chinonFile',firstData.file);
    pm.select(first);
    editor.setComponents(firstData.body);

    for (const item of loaded.slice(1)) {
      pm.add({name:item.name,chinonFile:item.file,component:item.body});
    }

    editor.setStyle(css);
    pm.select(first);
    ensureCanvasEnvironment();
    requestAnimationFrame(ensureCanvasEnvironment);
    localStorage.setItem(INIT_KEY,'1');
    await editor.store();
    editor.clearDirtyCount();
    refreshPages();
    setStatus('V7.8 溫暖生活版已載入：首頁、關於奇農、製茶堅持、GABA桑茶、秘魯瑪卡、檢測證書、相關資訊、聯繫我們。');
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


  // -------- V7.8 direct GitHub publish --------
  const PUBLISH_SETTINGS_KEY = 'chinon-publish-settings-v1';
  const PUBLISH_TOKEN_KEY = 'chinon-github-token-session';

  function publishProgress(message, type='') {
    const el = $('#publishProgress');
    if (!el) return;
    el.textContent = message;
    el.classList.remove('ok','error');
    if (type) el.classList.add(type);
  }

  function loadPublishSettings() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(PUBLISH_SETTINGS_KEY) || '{}'); } catch {}

    $('#publishOwner').value = saved.owner || 'TSRCBC';
    $('#publishRepo').value = saved.repo || 'TSRCBC.github.io';
    $('#publishBranch').value = saved.branch || 'main';
    $('#publishToken').value = sessionStorage.getItem(PUBLISH_TOKEN_KEY) || '';
  }

  function savePublishSettings() {
    const owner = $('#publishOwner').value.trim();
    const repo = $('#publishRepo').value.trim();
    const branch = $('#publishBranch').value.trim() || 'main';
    const token = $('#publishToken').value.trim();

    localStorage.setItem(PUBLISH_SETTINGS_KEY, JSON.stringify({ owner, repo, branch }));

    if (token) sessionStorage.setItem(PUBLISH_TOKEN_KEY, token);
    else sessionStorage.removeItem(PUBLISH_TOKEN_KEY);

    return { owner, repo, branch, token };
  }

  function openPublishDialog() {
    loadPublishSettings();
    publishProgress('準備發布。這會直接更新 GitHub main branch 與正式網站。');
    $('#publishDialog').showModal();
  }

  function bytesToBase64(bytes) {
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  async function dataUrlToBase64(dataUrl) {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const bytes = new Uint8Array(await blob.arrayBuffer());
    return {
      mime: blob.type || 'application/octet-stream',
      base64: bytesToBase64(bytes)
    };
  }

  async function buildPublishFiles() {
    const files = new Map();
    let imgCounter = 1;

    for (const page of editor.Pages.getAll()) {
      const root = page.getMainComponent();
      let html = cleanSnapshotAttrs(editor.getHtml({component:root}));
      const doc = new DOMParser().parseFromString(`<body>${html}</body>`,'text/html');

      for (const img of [...doc.body.querySelectorAll('img[src^="data:"]')]) {
        const src = img.getAttribute('src');
        const parsed = await dataUrlToBase64(src);
        const ext = extFromMime(parsed.mime);
        const name = `image-${imgCounter++}.${ext}`;
        const path = `assets/uploads/${name}`;
        files.set(path, { content: parsed.base64, encoding:'base64' });
        img.setAttribute('src', path);
      }

      html = doc.body.innerHTML;
      files.set(pageFile(page), {
        content: docForPage(page, html),
        encoding:'utf-8'
      });
    }

    let css = editor.getCss() || '';
    if (!css.includes('fonts.googleapis.com')) {
      css = `@import url('${CFG.fontUrl}');\n\n` + css;
    }

    files.set('styles.css', { content:css, encoding:'utf-8' });
    files.set('main.js', { content:'// CHINON site script\n', encoding:'utf-8' });

    return files;
  }

  async function githubApi(url, token, options={}) {
    const headers = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {})
    };

    let res;
    try {
      res = await fetch(url, { ...options, headers });
    } catch (error) {
      throw new Error(`無法連線 GitHub API：${error.message}`);
    }

    if (!res.ok) {
      let detail = '';
      try {
        const data = await res.json();
        detail = data?.message || JSON.stringify(data);
      } catch {
        detail = await res.text();
      }

      if (res.status === 401) {
        throw new Error('GitHub Token 無效或已過期。請重新建立 Token。');
      }
      if (res.status === 403) {
        throw new Error('GitHub 拒絕發布。請確認 Token 已授權此 Repository，且 Contents 權限為 Read and write。');
      }
      if (res.status === 404) {
        throw new Error('找不到 Repository / Branch，或 Token 沒有這個 Repository 的存取權。');
      }

      throw new Error(`GitHub API ${res.status}：${detail}`);
    }

    if (res.status === 204) return null;
    return await res.json();
  }

  async function createGithubBlob(owner, repo, token, file) {
    return githubApi(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/blobs`,
      token,
      {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          content:file.content,
          encoding:file.encoding === 'base64' ? 'base64' : 'utf-8'
        })
      }
    );
  }

  async function publishToGithub() {
    const button = $('#btnDoPublish');
    const { owner, repo, branch, token } = savePublishSettings();

    if (!owner || !repo || !branch || !token) {
      publishProgress('請完整填寫 Owner、Repository、Branch 與 GitHub Token。', 'error');
      return;
    }

    if (!confirm(`確定直接發布到 ${owner}/${repo} 的 ${branch} 分支？\n\n發布後 GitHub Pages 會重新部署正式網站。`)) {
      return;
    }

    button.disabled = true;

    try {
      publishProgress('1/6 正在儲存目前編輯內容…');
      await editor.store();
      editor.clearDirtyCount();

      publishProgress('2/6 正在整理網站檔案…');
      const files = await buildPublishFiles();

      publishProgress('3/6 正在讀取 GitHub 最新版本…');
      const ref = await githubApi(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/ref/heads/${encodeURIComponent(branch)}`,
        token
      );
      const parentSha = ref.object.sha;

      const parentCommit = await githubApi(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/commits/${parentSha}`,
        token
      );
      const baseTreeSha = parentCommit.tree.sha;

      publishProgress(`4/6 正在上傳 ${files.size} 個網站檔案…`);
      const entries = [];

      let done = 0;
      for (const [path, file] of files) {
        const blob = await createGithubBlob(owner, repo, token, file);
        entries.push({
          path,
          mode:'100644',
          type:'blob',
          sha:blob.sha
        });
        done += 1;
        publishProgress(`4/6 正在上傳網站檔案… ${done}/${files.size}`);
      }

      // 找出已刪除的「根目錄 HTML 頁面」，發布時一起從網站移除。
      // 404.html 保留，不碰 editor/、assets/ 或其他設定檔。
      const existingTree = await githubApi(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${baseTreeSha}?recursive=1`,
        token
      );

      const currentPaths = new Set(files.keys());
      for (const item of existingTree.tree || []) {
        if (
          item.type === 'blob' &&
          /^[^/]+\.html$/i.test(item.path) &&
          item.path.toLowerCase() !== '404.html' &&
          !currentPaths.has(item.path)
        ) {
          entries.push({
            path:item.path,
            mode:'100644',
            type:'blob',
            sha:null
          });
        }
      }

      publishProgress('5/6 正在建立 GitHub Commit…');
      const tree = await githubApi(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees`,
        token,
        {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            base_tree:baseTreeSha,
            tree:entries
          })
        }
      );

      const commit = await githubApi(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/commits`,
        token,
        {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            message:`Publish CHINON site ${new Date().toLocaleString('zh-TW')}`,
            tree:tree.sha,
            parents:[parentSha]
          })
        }
      );

      publishProgress('6/6 正在更新正式網站分支…');
      await githubApi(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/refs/heads/${encodeURIComponent(branch)}`,
        token,
        {
          method:'PATCH',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            sha:commit.sha,
            force:false
          })
        }
      );

      publishProgress(
        `發布成功！\nCommit：${commit.sha.slice(0,7)}\nGitHub Pages 通常還需要一點時間重新部署。`,
        'ok'
      );
      setStatus('網站已送出 GitHub 發布，等待 GitHub Pages 部署。');

    } catch (error) {
      console.error(error);
      publishProgress(`發布失敗：${error.message}`, 'error');
      setStatus('發布失敗，請查看發布視窗中的錯誤訊息。');
    } finally {
      button.disabled = false;
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
    setStatus('草稿已儲存在這台瀏覽器。尚未發布到正式網站。');
  });

  $('#btnReload').addEventListener('click',()=>loadLive({ask:true}));
  $('#btnPublish').addEventListener('click',openPublishDialog);
  $('#btnDoPublish').addEventListener('click',publishToGithub);
  $('#btnForgetToken').addEventListener('click',()=>{
    sessionStorage.removeItem(PUBLISH_TOKEN_KEY);
    $('#publishToken').value = '';
    publishProgress('目前分頁中的 GitHub Token 已清除。');
  });
  $('#btnExport').addEventListener('click',exportZip);

  document.querySelectorAll('[data-device]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      editor.setDevice(btn.dataset.device);
      setStatus(`預覽：${btn.textContent}`);
    });
  });

  editor.on('page:select',()=>{
    removeTextResizeOverlay();
    refreshPages();
    requestAnimationFrame(ensureCanvasEnvironment);
    setTimeout(ensureCanvasEnvironment, 80);
  });

  // GrapesJS 重新建立 iframe/frame 時，base 與 :root 變數可能會被清掉。
  // 每次 frame load 都補回來，避免 Logo/按鈕樣式「一下有、一下不見」。
  editor.on('canvas:frame:load',()=>{
    ensureCanvasEnvironment();
    requestAnimationFrame(ensureCanvasEnvironment);
  });
  let autoTextResizeTimer = null;

  editor.on('component:selected',(c)=>{
    requestAnimationFrame(() => translatePanelText(document));
    if (moveState.component && moveState.component !== c) stopMove();

    if (autoTextResizeTimer) {
      clearTimeout(autoTextResizeTimer);
      autoTextResizeTimer = null;
    }

    const target = textResizeTarget(c);

    if (target) {
      // 文字不必再按按鈕：選到文字後直接顯示 Canva 式控制框。
      autoTextResizeTimer = setTimeout(()=>{
        if (editor.getSelected() !== c && editor.getSelected() !== target) return;
        openCanvaTextResize(editor.getSelected() || target);
      }, 30);

      const name = target.getName?.() || target.get('tagName') || '文字';
      setStatus(`已選取：${name}。直接拖四角放大/縮小字體；拖左右只改文字框寬度。`);
      return;
    }

    if (textResizeState.component) {
      removeTextResizeOverlay();
    }

    const name = c.getName?.() || c.get('tagName') || '元件';
    setStatus(`已選取：${name}。非文字元件可用上方「文字縮放」按鈕啟用一般尺寸縮放。`);
  });

  editor.on('load',async()=>{
    enableChineseRightPanel();
    ensureCanvasBase();
    if (!localStorage.getItem(INIT_KEY)) {
      await loadLive({ask:false});
      localStorage.setItem(INIT_KEY,'1');
    }
    refreshPages();
    setStatus('V7.8 已就緒。文字可雙擊修改；按「Canva縮放」可拖框縮放字體。');
  });
})();
