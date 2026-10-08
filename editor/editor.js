
(() => {
  'use strict';

  const CFG = window.CHINON_EDITOR_CONFIG;
  const $ = (sel) => document.querySelector(sel);
  const statusText = $('#statusText');

  const PAGES = [
    { file: 'index.html',        name: '首頁',       title: '首頁｜奇農 CHINON' },
    { file: 'about.html',        name: '關於奇農',   title: '關於奇農｜CHINON' },
    { file: 'craft.html',        name: '製茶堅持',   title: '製茶堅持｜CHINON' },
    { file: 'gaba.html',         name: 'GABA桑茶',   title: 'GABA 桑茶｜CHINON' },
    { file: 'maca.html',         name: '秘魯瑪卡',   title: '秘魯瑪卡｜CHINON' },
    { file: 'certificates.html', name: '檢測證書',   title: '檢測證書｜CHINON' },
    { file: 'info.html',         name: '相關資訊',   title: '相關資訊｜CHINON' },
    { file: 'contact.html',      name: '聯繫我們',   title: '聯繫我們｜CHINON' },
  ];

  const PAGE_BY_FILE = Object.fromEntries(PAGES.map(p => [p.file, p]));
  const STORAGE_KEY = 'chinon-grapes-project-v3';
  const INIT_KEY = 'chinon-grapes-initialized-v3';
  const SNAPSHOT_ATTR = 'data-chinon-move-snapshot';

  function setStatus(msg) {
    statusText.textContent = msg;
  }

  function fontOptions() {
    return [
      { id: '"Noto Sans TC", sans-serif', label: 'TW｜思源黑體' },
      { id: '"Noto Serif TC", serif', label: 'TW｜思源宋體' },
      { id: '"LXGW WenKai TC", serif', label: 'TW｜霞鶩文楷' },
      { id: '"Iansui", cursive', label: 'TW｜芫荽體' },
      { id: '"Klee One", cursive', label: 'TW｜Klee 手寫' },
      { id: '"Zen Kurenaido", cursive', label: 'TW｜Zen 手寫' },
      { id: '"Yuji Syuku", serif', label: 'TW｜Yuji 書寫' },
      { id: 'Arial, sans-serif', label: 'Arial' },
      { id: '"Times New Roman", serif', label: 'Times New Roman' },
    ];
  }

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
      options: {
        local: { key: STORAGE_KEY }
      }
    },

    deviceManager: {
      devices: [
        { id: 'Desktop', name: 'Desktop', width: '' },
        { id: 'Tablet',  name: 'Tablet', width: '820px', widthMedia: '980px' },
        { id: 'Mobile',  name: 'Mobile', width: '390px', widthMedia: '600px' },
      ]
    },

    canvas: {
      styles: [CFG.fontUrl]
    },

    selectorManager: {
      componentFirst: true
    },

    styleManager: {
      sectors: [
        {
          name: '位置與尺寸',
          open: true,
          buildProps: [
            'position', 'top', 'right', 'bottom', 'left', 'z-index',
            'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
            'display', 'overflow'
          ],
        },
        {
          name: '間距',
          open: false,
          buildProps: [
            'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
            'padding-top', 'padding-right', 'padding-bottom', 'padding-left'
          ],
        },
        {
          name: '字型與文字',
          open: true,
          properties: [
            {
              property: 'font-family',
              name: '字型',
              type: 'select',
              options: fontOptions()
            },
            { property: 'font-size', name: '字體大小' },
            { property: 'font-weight', name: '粗細' },
            { property: 'line-height', name: '行高' },
            { property: 'letter-spacing', name: '字距' },
            { property: 'color', name: '文字顏色' },
            { property: 'text-align', name: '對齊' },
            { property: 'text-shadow', name: '文字陰影', type: 'text' },
          ],
        },
        {
          name: '背景與陰影',
          open: false,
          buildProps: [
            'background-color', 'background-image', 'background-position',
            'background-size', 'border', 'border-radius', 'opacity'
          ],
          properties: [
            { property: 'box-shadow', name: '區塊陰影', type: 'text' }
          ]
        },
        {
          name: 'Flex / Grid',
          open: false,
          buildProps: [
            'flex-direction', 'justify-content', 'align-items', 'align-content',
            'gap', 'grid-template-columns', 'grid-template-rows'
          ]
        }
      ]
    }
  });

  // ---------- 基本工具 ----------

  function currentPage() {
    return editor.Pages.getSelected();
  }

  function currentPageFile() {
    const page = currentPage();
    return page && (page.get('chinonFile') || fileFromPageName(page.getName?.() || page.get('name')));
  }

  function fileFromPageName(name) {
    const found = PAGES.find(p => p.name === name);
    return found ? found.file : 'index.html';
  }

  function selectedOrWarn() {
    const component = editor.getSelected();
    if (!component) {
      alert('請先在畫布上點選一個文字、圖片、按鈕或區塊。');
      return null;
    }
    return component;
  }

  function movementKeys(style = {}) {
    const keys = ['position', 'top', 'right', 'bottom', 'left', 'z-index', 'transform'];
    return Object.fromEntries(keys.map(k => [k, Object.prototype.hasOwnProperty.call(style, k) ? style[k] : null]));
  }

  function ensureMoveSnapshot(component) {
    const attrs = component.getAttributes?.() || {};
    if (attrs[SNAPSHOT_ATTR]) return;

    const snapshot = movementKeys(component.getStyle?.() || {});
    component.addAttributes({
      [SNAPSHOT_ATTR]: encodeURIComponent(JSON.stringify(snapshot))
    });
  }

  function restoreSnapshot(component) {
    const attrs = component.getAttributes?.() || {};
    const encoded = attrs[SNAPSHOT_ATTR];
    if (!encoded) {
      setStatus('這個元件沒有可恢復的位置紀錄。');
      return;
    }

    let snapshot;
    try {
      snapshot = JSON.parse(decodeURIComponent(encoded));
    } catch {
      alert('位置紀錄無法讀取。');
      return;
    }

    const style = { ...(component.getStyle?.() || {}) };
    for (const [key, value] of Object.entries(snapshot)) {
      if (value === null || value === '') {
        delete style[key];
      } else {
        style[key] = value;
      }
    }

    component.setStyle(style);
    component.removeAttributes(SNAPSHOT_ATTR);

    try { component.setDragMode(''); } catch {}
    setStatus('已恢復這個元件進入移動模式前的位置。');
  }

  function setModeButton(activeId) {
    ['btnNudge', 'btnFreeMove'].forEach(id => {
      const el = $('#' + id);
      if (el) el.classList.toggle('mode-active', id === activeId);
    });
  }

  // ---------- 兩種移動方式 ----------

  function enableNudgeMove() {
    const component = selectedOrWarn();
    if (!component) return;

    ensureMoveSnapshot(component);

    // GrapesJS 的 translate drag mode 會以 transform 平移；
    // 元件仍留在原本 Flex/Grid 流程中，適合大多數調整。
    try {
      component.setDragMode('translate');
      editor.setDragMode('translate');
    } catch (err) {
      console.warn(err);
    }

    setModeButton('btnNudge');
    setStatus('「微調拖動」已開啟：現在直接拖選取物件。它仍保留在原本 Flex/Grid 排版中。');
  }

  function enableFreeMove() {
    const component = selectedOrWarn();
    if (!component) return;

    ensureMoveSnapshot(component);

    const parent = component.parent?.();
    if (parent?.getStyle && parent?.addStyle) {
      const parentStyle = parent.getStyle() || {};
      // relative 不會讓父層脫離排版，但可當 absolute 子元件的定位基準。
      if (!parentStyle.position) {
        parent.addStyle({ position: 'relative' });
      }
    }

    try {
      component.setDragMode('absolute');
      editor.setDragMode('absolute');
    } catch (err) {
      console.warn(err);
    }

    // 如果沒有層級，給一個溫和的預設值；之後可用工具列上下層調整。
    const style = component.getStyle?.() || {};
    if (!style['z-index']) component.addStyle({ 'z-index': '3' });

    setModeButton('btnFreeMove');
    setStatus('「自由定位」已開啟：適合 Hero 標題、裝飾圖、浮動按鈕。一般卡片/導覽列不要用這個。');
  }

  function changeLayer(delta, top = false) {
    const component = selectedOrWarn();
    if (!component) return;

    ensureMoveSnapshot(component);

    const style = component.getStyle?.() || {};
    let z = parseInt(style['z-index'], 10);
    if (!Number.isFinite(z)) z = 1;

    z = top ? 999 : Math.max(0, z + delta);
    component.addStyle({ 'z-index': String(z) });
    setStatus(`目前元件 z-index = ${z}`);
  }

  // ---------- 匯入目前 GitHub Pages ----------

  function sanitizeLegacyCss(css) {
    // 只清掉先前已知會卡住首頁字型選擇的兩個舊 ID 規則。
    // 其餘原站 CSS 完整保留，避免再次大改造成跑版。
    return String(css || '')
      .replace(/#igmcb\s*\{\s*font-family\s*:[^;]+;\s*\}/gi, '')
      .replace(/#i9rjf\s*\{\s*font-family\s*:[^;]+;\s*\}/gi, '');
  }

  function normalizeImportedBody(doc, sourceUrl) {
    doc.querySelectorAll('script').forEach(el => el.remove());

    doc.querySelectorAll('link[rel="stylesheet"]').forEach(el => {
      const href = el.getAttribute('href') || '';
      if (/styles?\.css/i.test(href)) el.remove();
    });

    for (const el of doc.querySelectorAll('[src]')) {
      const value = el.getAttribute('src');
      if (!value || /^(https?:|data:|blob:|#)/i.test(value)) continue;
      try { el.setAttribute('src', new URL(value, sourceUrl).href); } catch {}
    }

    for (const el of doc.querySelectorAll('[href]')) {
      const value = el.getAttribute('href');
      if (!value || /^(https?:|mailto:|tel:|javascript:|#)/i.test(value)) continue;
      try { el.setAttribute('href', new URL(value, sourceUrl).href); } catch {}
    }

    return doc.body ? doc.body.innerHTML : '';
  }

  async function fetchText(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.text();
  }

  async function loadLiveCss() {
    for (const candidate of CFG.cssCandidates) {
      try {
        const css = await fetchText(candidate + `?t=${Date.now()}`);
        if (css && css.trim()) return sanitizeLegacyCss(css);
      } catch {}
    }
    return sanitizeLegacyCss(CFG.fallbackCss || '');
  }

  async function loadLivePage(pageInfo) {
    const url = new URL(`../${pageInfo.file}?t=${Date.now()}`, location.href);

    try {
      const source = await fetchText(url.href);
      const doc = new DOMParser().parseFromString(source, 'text/html');
      return normalizeImportedBody(doc, url.href);
    } catch (err) {
      if (pageInfo.file === 'index.html' && CFG.fallbackHomeBody) {
        return CFG.fallbackHomeBody;
      }

      return `
        <main style="padding:60px;font-family:sans-serif">
          <h1>${pageInfo.name}</h1>
          <p>目前無法從 GitHub Pages 載入 ${pageInfo.file}。</p>
          <p>請確認這個檔案存在於 TSRCBC.github.io 儲存庫根目錄。</p>
        </main>`;
    }
  }

  function refreshPageSelect() {
    const select = $('#pageSelect');
    select.innerHTML = '';

    editor.Pages.getAll().forEach((page) => {
      const file = page.get('chinonFile') || fileFromPageName(page.get('name'));
      const info = PAGE_BY_FILE[file] || { name: page.get('name') || file };
      const opt = document.createElement('option');
      opt.value = file;
      opt.textContent = info.name;
      select.appendChild(opt);
    });

    select.value = currentPageFile() || 'index.html';
  }

  async function importCurrentGithubSite({ ask = true } = {}) {
    if (ask && !confirm('這會重新抓取 GitHub Pages 上目前的正式網站，並覆蓋這台瀏覽器裡尚未匯出的編輯內容。要繼續嗎？')) {
      return;
    }

    setStatus('正在讀取 GitHub Pages…');
    editor.Storage.setAutosave(false);

    try {
      const css = await loadLiveCss();
      const bodies = [];

      for (const p of PAGES) {
        setStatus(`正在載入：${p.name}…`);
        bodies.push([p, await loadLivePage(p)]);
      }

      const pm = editor.Pages;
      const all = [...pm.getAll()];
      const first = all[0] || pm.add({ name: '首頁', component: '' });

      all.slice(1).forEach(p => pm.remove(p));

      first.set('name', PAGES[0].name);
      first.set('chinonFile', PAGES[0].file);
      pm.select(first);
      editor.setComponents(bodies[0][1]);

      for (let i = 1; i < bodies.length; i++) {
        const [info, body] = bodies[i];
        pm.add({
          name: info.name,
          component: body,
          chinonFile: info.file
        });
      }

      editor.setStyle(css);
      pm.select(first);

      localStorage.setItem(INIT_KEY, '1');
      await editor.store();
      editor.clearDirtyCount();
      refreshPageSelect();

      setStatus('已載入目前正式網站。之後先用「微調拖動」；真的需要浮動時再用「自由定位」。');
    } catch (err) {
      console.error(err);
      setStatus(`載入失敗：${err.message}`);
      alert('載入網站失敗。請確認 GitHub Pages 已發布，並且 styles.css 存在。');
    } finally {
      editor.Storage.setAutosave(true);
    }
  }

  // ---------- Code 面板 ----------

  function openCodeDialog() {
    const page = currentPage();
    const cmp = page?.getMainComponent();

    $('#htmlCode').value = cmp ? editor.getHtml({ component: cmp }) : editor.getHtml();
    $('#cssCode').value = editor.getCss();
    $('#codeDialog').showModal();
  }

  function applyCode() {
    editor.setComponents($('#htmlCode').value);
    editor.setStyle($('#cssCode').value);
    $('#codeDialog').close();
    setStatus('HTML / CSS 已套用。');
  }

  // ---------- 匯出 ----------

  function googleFontImport() {
    return `@import url('${CFG.fontUrl}');\n\n`;
  }

  function exportedCss() {
    const css = editor.getCss() || '';
    return css.includes('fonts.googleapis.com') ? css : googleFontImport() + css;
  }

  function cleanEditorAttributes(html) {
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
    doc.body.querySelectorAll(`[${SNAPSHOT_ATTR}]`).forEach(el => {
      el.removeAttribute(SNAPSHOT_ATTR);
    });
    return doc.body.innerHTML;
  }

  function pageDocument(page, cssFilename = 'styles.css') {
    const component = page.getMainComponent();
    const bodyRaw = editor.getHtml({ component });
    const body = cleanEditorAttributes(bodyRaw);
    const file = page.get('chinonFile') || fileFromPageName(page.get('name'));
    const info = PAGE_BY_FILE[file] || { title: page.get('name') || 'CHINON 奇農' };

    return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="index,follow">
  <meta name="description" content="CHINON 奇農｜黃金 GABA 桑茶">
  <title>${escapeHtml(info.title || 'CHINON 奇農')}</title>
  <link rel="icon" type="image/png" href="assets/chinon-logo.png">
  <link rel="stylesheet" href="${cssFilename}">
</head>
<body>
${body}
<script src="main.js"></script>
</body>
</html>`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  async function exportSiteZip() {
    setStatus('正在建立網站 ZIP…');

    const zip = new JSZip();
    const css = exportedCss();

    editor.Pages.getAll().forEach((page) => {
      const file = page.get('chinonFile') || fileFromPageName(page.get('name'));
      zip.file(file, pageDocument(page));
    });

    zip.file('styles.css', css);
    zip.file('editor-backup.json', JSON.stringify(editor.getProjectData(), null, 2));
    zip.file('上傳說明.txt',
`CHINON 編輯器 V2 匯出檔

上傳/覆蓋到 TSRCBC.github.io 儲存庫根目錄：
- index.html
- about.html
- craft.html
- gaba.html
- maca.html
- certificates.html
- info.html
- contact.html
- styles.css

保留原本：
- main.js
- assets/
- editor/

editor-backup.json 是備份，不需要放到正式網站根目錄。

移動原則：
1. 平常先用「微調拖動」：保留 Flex/Grid。
2. Hero 標題、裝飾圖、浮動按鈕才用「自由定位」。
3. 若位置不對，選取元件後按「恢復原位」。
`);

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chinon-site-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    setStatus('網站 ZIP 已下載。到 GitHub 根目錄 Upload files → 覆蓋 → Commit 即可發布。');
  }

  async function copyText(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(`${label} 已複製。`);
    } catch {
      alert('瀏覽器不允許直接複製，請在文字框中 Ctrl+A → Ctrl+C。');
    }
  }

  // ---------- UI ----------

  $('#btnReload').addEventListener('click', () => importCurrentGithubSite({ ask: true }));

  $('#btnSave').addEventListener('click', async () => {
    await editor.store();
    editor.clearDirtyCount();
    setStatus('已儲存在這台瀏覽器。');
  });

  $('#btnNudge').addEventListener('click', enableNudgeMove);
  $('#btnFreeMove').addEventListener('click', enableFreeMove);

  $('#btnResetMove').addEventListener('click', () => {
    const component = selectedOrWarn();
    if (!component) return;
    restoreSnapshot(component);
    setModeButton(null);
  });

  $('#btnLayerUp').addEventListener('click', () => changeLayer(1));
  $('#btnLayerDown').addEventListener('click', () => changeLayer(-1));
  $('#btnLayerTop').addEventListener('click', () => changeLayer(0, true));

  $('#btnCode').addEventListener('click', openCodeDialog);
  $('#btnExport').addEventListener('click', exportSiteZip);

  $('#btnCloseCode').addEventListener('click', () => $('#codeDialog').close());
  $('#btnApplyCode').addEventListener('click', applyCode);
  $('#btnCopyHtml').addEventListener('click', () => copyText($('#htmlCode').value, 'HTML'));
  $('#btnCopyCss').addEventListener('click', () => copyText($('#cssCode').value, 'CSS'));

  document.querySelectorAll('[data-device]').forEach((btn) => {
    btn.addEventListener('click', () => {
      editor.setDevice(btn.dataset.device);
      setStatus(`預覽：${btn.textContent}`);
    });
  });

  $('#pageSelect').addEventListener('change', (ev) => {
    const file = ev.target.value;
    const page = editor.Pages.getAll().find(p =>
      (p.get('chinonFile') || fileFromPageName(p.get('name'))) === file
    );

    if (page) {
      editor.Pages.select(page);
      setStatus(`目前頁面：${PAGE_BY_FILE[file]?.name || file}`);
    }
  });

  editor.on('page:select', () => refreshPageSelect());

  editor.on('component:selected', (component) => {
    setModeButton(null);
    const name = component.getName?.() || component.get('tagName') || '元件';
    setStatus(`已選取：${name}。一般移動按「↔ 微調拖動」；要浮動才按「✥ 自由定位」。`);
  });

  editor.on('load', async () => {
    refreshPageSelect();

    if (!localStorage.getItem(INIT_KEY)) {
      await importCurrentGithubSite({ ask: false });
    } else {
      setStatus('已載入上次的本機編輯內容。');
    }
  });

})();
