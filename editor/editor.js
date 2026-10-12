
(() => {
  'use strict';

  // -------- V8.4 前端管理者登入鎖 --------
  const LOGIN_USERNAME = 'luke';
  const LOGIN_PASSWORD_SHA256 = '23f26c1f19c8ef676e496b4021c12831ecbd11c4ba400b516dda4badf653d71c';
  const LOGIN_SESSION_KEY = 'chinon-admin-auth-v84';

  async function sha256Hex(value) {
    const data = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(digest)]
      .map(b => b.toString(16).padStart(2,'0'))
      .join('');
  }

  function unlockEditor() {
    const gate = document.querySelector('#loginGate');
    document.body.classList.remove('auth-locked');
    gate?.classList.add('is-hidden');
    gate?.setAttribute('aria-hidden','true');
  }

  function initAdminLogin() {
    const gate = document.querySelector('#loginGate');
    if (!gate) return;

    if (sessionStorage.getItem(LOGIN_SESSION_KEY) === 'ok') {
      unlockEditor();
      return;
    }

    const form = document.querySelector('#loginForm');
    const user = document.querySelector('#loginUser');
    const pass = document.querySelector('#loginPass');
    const error = document.querySelector('#loginError');
    const toggle = document.querySelector('#togglePassword');
    const card = gate.querySelector('.login-card');

    toggle?.addEventListener('click', () => {
      const show = pass.type === 'password';
      pass.type = show ? 'text' : 'password';
      toggle.textContent = show ? '隱藏' : '顯示';
      toggle.setAttribute('aria-label', show ? '隱藏密碼' : '顯示密碼');
    });

    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      error.textContent = '';

      const inputUser = user.value.trim();
      const inputHash = await sha256Hex(pass.value);

      if (inputUser === LOGIN_USERNAME && inputHash === LOGIN_PASSWORD_SHA256) {
        sessionStorage.setItem(LOGIN_SESSION_KEY,'ok');
        unlockEditor();
        setTimeout(() => user.value = pass.value = '', 400);
        return;
      }

      error.textContent = '帳號或密碼錯誤，請重新輸入。';
      pass.value = '';
      pass.focus();
      card?.classList.remove('shake');
      void card?.offsetWidth;
      card?.classList.add('shake');
    });

    setTimeout(() => user?.focus(), 120);
  }

  initAdminLogin();


  const CFG = window.CHINON_CONFIG;
  const $ = (s) => document.querySelector(s);
  const statusText = $('#statusText');
  const RUNTIME_BUILD = 'V8.7';
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

    storageManager: false,

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
          properties: [
            {
              property: 'position', name: '定位方式', type: 'select',
              options: [
                { id:'static', label:'靜態（一般）' },
                { id:'relative', label:'相對定位' },
                { id:'absolute', label:'絕對定位' },
                { id:'fixed', label:'固定在畫面' },
                { id:'sticky', label:'黏著定位' }
              ]
            },
            {
              property:'z-index', name:'圖層順序', type:'select',
              options:[
                {id:'auto',label:'自動'},
                {id:'0',label:'0'},
                {id:'1',label:'1'},
                {id:'2',label:'2'},
                {id:'5',label:'5'},
                {id:'10',label:'10'},
                {id:'20',label:'20'},
                {id:'50',label:'50'},
                {id:'100',label:'100'},
                {id:'999',label:'最上層 999'}
              ]
            },
            {
              property:'top', name:'上方位置', type:'select',
              options:[
                {id:'auto',label:'自動'},{id:'-100px',label:'-100 px'},{id:'-50px',label:'-50 px'},
                {id:'-20px',label:'-20 px'},{id:'-10px',label:'-10 px'},{id:'0',label:'0'},
                {id:'10px',label:'10 px'},{id:'20px',label:'20 px'},{id:'50px',label:'50 px'},
                {id:'100px',label:'100 px'},{id:'25%',label:'25%'},{id:'50%',label:'50%'}
              ]
            },
            {
              property:'right', name:'右方位置', type:'select',
              options:[
                {id:'auto',label:'自動'},{id:'-100px',label:'-100 px'},{id:'-50px',label:'-50 px'},
                {id:'-20px',label:'-20 px'},{id:'-10px',label:'-10 px'},{id:'0',label:'0'},
                {id:'10px',label:'10 px'},{id:'20px',label:'20 px'},{id:'50px',label:'50 px'},
                {id:'100px',label:'100 px'},{id:'25%',label:'25%'},{id:'50%',label:'50%'}
              ]
            },
            {
              property:'bottom', name:'下方位置', type:'select',
              options:[
                {id:'auto',label:'自動'},{id:'-100px',label:'-100 px'},{id:'-50px',label:'-50 px'},
                {id:'-20px',label:'-20 px'},{id:'-10px',label:'-10 px'},{id:'0',label:'0'},
                {id:'10px',label:'10 px'},{id:'20px',label:'20 px'},{id:'50px',label:'50 px'},
                {id:'100px',label:'100 px'},{id:'25%',label:'25%'},{id:'50%',label:'50%'}
              ]
            },
            {
              property:'left', name:'左方位置', type:'select',
              options:[
                {id:'auto',label:'自動'},{id:'-100px',label:'-100 px'},{id:'-50px',label:'-50 px'},
                {id:'-20px',label:'-20 px'},{id:'-10px',label:'-10 px'},{id:'0',label:'0'},
                {id:'10px',label:'10 px'},{id:'20px',label:'20 px'},{id:'50px',label:'50 px'},
                {id:'100px',label:'100 px'},{id:'25%',label:'25%'},{id:'50%',label:'50%'}
              ]
            },
            {
              property:'width', name:'寬度', type:'select',
              options:[
                {id:'auto',label:'自動'},
                {id:'fit-content',label:'依內容'},
                {id:'25%',label:'25%'},{id:'33.333%',label:'1/3'},
                {id:'50%',label:'50%'},{id:'66.667%',label:'2/3'},
                {id:'75%',label:'75%'},{id:'100%',label:'100%'},
                {id:'200px',label:'200 px'},{id:'300px',label:'300 px'},
                {id:'400px',label:'400 px'},{id:'500px',label:'500 px'},
                {id:'600px',label:'600 px'},{id:'800px',label:'800 px'}
              ]
            },
            {
              property:'height', name:'高度', type:'select',
              options:[
                {id:'auto',label:'自動'},
                {id:'100px',label:'100 px'},{id:'150px',label:'150 px'},
                {id:'200px',label:'200 px'},{id:'300px',label:'300 px'},
                {id:'400px',label:'400 px'},{id:'500px',label:'500 px'},
                {id:'600px',label:'600 px'},{id:'100vh',label:'滿版高度'}
              ]
            },
            {
              property:'min-width', name:'最小寬度', type:'select',
              options:[
                {id:'auto',label:'自動'},{id:'0',label:'0'},
                {id:'200px',label:'200 px'},{id:'300px',label:'300 px'},
                {id:'50%',label:'50%'},{id:'100%',label:'100%'}
              ]
            },
            {
              property:'max-width', name:'最大寬度', type:'select',
              options:[
                {id:'none',label:'不限'},{id:'320px',label:'320 px'},
                {id:'480px',label:'480 px'},{id:'640px',label:'640 px'},
                {id:'800px',label:'800 px'},{id:'1000px',label:'1000 px'},
                {id:'1200px',label:'1200 px'},{id:'100%',label:'100%'}
              ]
            },
            {
              property:'display', name:'顯示方式', type:'select',
              options:[
                {id:'block',label:'區塊'},
                {id:'inline',label:'行內'},
                {id:'inline-block',label:'行內區塊'},
                {id:'flex',label:'彈性排列 Flex'},
                {id:'grid',label:'網格 Grid'},
                {id:'none',label:'隱藏'}
              ]
            },
            {
              property:'overflow', name:'超出內容', type:'select',
              options:[
                {id:'visible',label:'顯示'},
                {id:'hidden',label:'隱藏'},
                {id:'auto',label:'需要時捲動'},
                {id:'scroll',label:'永遠捲動'}
              ]
            },
            {
              property:'transform', name:'變形效果', type:'select',
              options:[
                {id:'none',label:'無'},
                {id:'scale(0.8)',label:'縮小 80%'},
                {id:'scale(0.9)',label:'縮小 90%'},
                {id:'scale(1.1)',label:'放大 110%'},
                {id:'scale(1.2)',label:'放大 120%'},
                {id:'rotate(-5deg)',label:'向左轉 5°'},
                {id:'rotate(5deg)',label:'向右轉 5°'},
                {id:'rotate(-10deg)',label:'向左轉 10°'},
                {id:'rotate(10deg)',label:'向右轉 10°'}
              ]
            }
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
                { id: '"Noto Sans TC", sans-serif', label: '思源黑體' },
                { id: '"Noto Serif TC", serif', label: '思源宋體' },
                { id: '"LXGW WenKai TC", serif', label: '霞鶩文楷' },
                { id: '"Iansui", cursive', label: '芫荽體' },
                { id: '"Klee One", cursive', label: 'Klee 手寫體' },
                { id: '"Zen Kurenaido", cursive', label: 'Zen 手寫體' },
                { id: '"Yuji Syuku", serif', label: 'Yuji 書寫體' },
                { id: 'Arial, sans-serif', label: 'Arial' },
                { id: '"Times New Roman", serif', label: 'Times New Roman' }
              ]
            },
            {
              property:'font-size', name:'字體大小', type:'select',
              options:[
                {id:'12px',label:'12 px｜極小'},
                {id:'14px',label:'14 px｜小'},
                {id:'16px',label:'16 px｜一般內文'},
                {id:'18px',label:'18 px'},
                {id:'20px',label:'20 px'},
                {id:'22px',label:'22 px'},
                {id:'24px',label:'24 px'},
                {id:'28px',label:'28 px'},
                {id:'32px',label:'32 px'},
                {id:'36px',label:'36 px'},
                {id:'40px',label:'40 px'},
                {id:'48px',label:'48 px'},
                {id:'56px',label:'56 px'},
                {id:'64px',label:'64 px'},
                {id:'72px',label:'72 px'},
                {id:'80px',label:'80 px'},
                {id:'96px',label:'96 px'},
                {id:'120px',label:'120 px'},
                {id:'144px',label:'144 px'}
              ]
            },
            {
              property:'font-weight', name:'粗細', type:'select',
              options:[
                {id:'100',label:'100｜極細'},
                {id:'200',label:'200｜很細'},
                {id:'300',label:'300｜細'},
                {id:'400',label:'400｜一般'},
                {id:'500',label:'500｜中等'},
                {id:'600',label:'600｜半粗'},
                {id:'700',label:'700｜粗體'},
                {id:'800',label:'800｜很粗'},
                {id:'900',label:'900｜最粗'}
              ]
            },
            {
              property:'font-style', name:'斜體', type:'select',
              options:[
                {id:'normal',label:'一般'},
                {id:'italic',label:'斜體'}
              ]
            },
            {
              property:'text-decoration', name:'文字裝飾', type:'select',
              options:[
                {id:'none',label:'無'},
                {id:'underline',label:'底線'},
                {id:'line-through',label:'刪除線'},
                {id:'overline',label:'上線'}
              ]
            },
            {
              property:'line-height', name:'行高', type:'select',
              options:[
                {id:'0.8',label:'0.8｜很緊'},
                {id:'0.9',label:'0.9'},
                {id:'1',label:'1.0｜緊'},
                {id:'1.1',label:'1.1'},
                {id:'1.2',label:'1.2'},
                {id:'1.3',label:'1.3'},
                {id:'1.4',label:'1.4｜一般'},
                {id:'1.5',label:'1.5'},
                {id:'1.6',label:'1.6'},
                {id:'1.8',label:'1.8'},
                {id:'2',label:'2.0｜寬鬆'},
                {id:'2.2',label:'2.2'},
                {id:'2.5',label:'2.5'}
              ]
            },
            {
              property:'letter-spacing', name:'字距', type:'select',
              options:[
                {id:'-3px',label:'-3 px｜很緊'},
                {id:'-2px',label:'-2 px'},
                {id:'-1px',label:'-1 px'},
                {id:'0px',label:'0｜一般'},
                {id:'0.5px',label:'0.5 px'},
                {id:'1px',label:'1 px'},
                {id:'2px',label:'2 px'},
                {id:'3px',label:'3 px'},
                {id:'4px',label:'4 px'},
                {id:'6px',label:'6 px'},
                {id:'8px',label:'8 px'},
                {id:'10px',label:'10 px'}
              ]
            },
            {
              property:'color', name:'文字顏色', type:'color', default:'#1b241e'
            },
            {
              property:'text-align', name:'對齊', type:'select',
              options:[
                {id:'left',label:'靠左'},
                {id:'center',label:'置中'},
                {id:'right',label:'靠右'},
                {id:'justify',label:'左右對齊'}
              ]
            },
            {
              property:'text-shadow', name:'文字陰影', type:'select',
              options:[
                {id:'none',label:'無陰影'},
                {id:'0 1px 2px rgba(0,0,0,.18)',label:'淡陰影'},
                {id:'0 2px 4px rgba(0,0,0,.22)',label:'柔和陰影'},
                {id:'0 3px 8px rgba(0,0,0,.28)',label:'中等陰影'},
                {id:'0 6px 16px rgba(0,0,0,.32)',label:'明顯陰影'},
                {id:'1px 1px 0 rgba(255,255,255,.75)',label:'淺色浮雕'},
                {id:'2px 2px 0 rgba(0,0,0,.18)',label:'硬邊陰影'}
              ]
            }
          ]
        },

        {
          name:'間距',
          open:false,
          properties:[
            {
              property:'margin-top', name:'上外距', type:'select',
              options:[
                {id:'auto',label:'自動'},{id:'-40px',label:'-40 px'},{id:'-24px',label:'-24 px'},
                {id:'-16px',label:'-16 px'},{id:'-8px',label:'-8 px'},{id:'0',label:'0'},
                {id:'4px',label:'4 px'},{id:'8px',label:'8 px'},{id:'12px',label:'12 px'},
                {id:'16px',label:'16 px'},{id:'20px',label:'20 px'},{id:'24px',label:'24 px'},
                {id:'32px',label:'32 px'},{id:'40px',label:'40 px'},{id:'48px',label:'48 px'},
                {id:'64px',label:'64 px'},{id:'80px',label:'80 px'},{id:'96px',label:'96 px'}
              ]
            },
            {
              property:'margin-right', name:'右外距', type:'select',
              options:[
                {id:'auto',label:'自動'},{id:'-40px',label:'-40 px'},{id:'-24px',label:'-24 px'},
                {id:'-16px',label:'-16 px'},{id:'-8px',label:'-8 px'},{id:'0',label:'0'},
                {id:'4px',label:'4 px'},{id:'8px',label:'8 px'},{id:'12px',label:'12 px'},
                {id:'16px',label:'16 px'},{id:'20px',label:'20 px'},{id:'24px',label:'24 px'},
                {id:'32px',label:'32 px'},{id:'40px',label:'40 px'},{id:'48px',label:'48 px'},
                {id:'64px',label:'64 px'},{id:'80px',label:'80 px'},{id:'96px',label:'96 px'}
              ]
            },
            {
              property:'margin-bottom', name:'下外距', type:'select',
              options:[
                {id:'auto',label:'自動'},{id:'-40px',label:'-40 px'},{id:'-24px',label:'-24 px'},
                {id:'-16px',label:'-16 px'},{id:'-8px',label:'-8 px'},{id:'0',label:'0'},
                {id:'4px',label:'4 px'},{id:'8px',label:'8 px'},{id:'12px',label:'12 px'},
                {id:'16px',label:'16 px'},{id:'20px',label:'20 px'},{id:'24px',label:'24 px'},
                {id:'32px',label:'32 px'},{id:'40px',label:'40 px'},{id:'48px',label:'48 px'},
                {id:'64px',label:'64 px'},{id:'80px',label:'80 px'},{id:'96px',label:'96 px'}
              ]
            },
            {
              property:'margin-left', name:'左外距', type:'select',
              options:[
                {id:'auto',label:'自動'},{id:'-40px',label:'-40 px'},{id:'-24px',label:'-24 px'},
                {id:'-16px',label:'-16 px'},{id:'-8px',label:'-8 px'},{id:'0',label:'0'},
                {id:'4px',label:'4 px'},{id:'8px',label:'8 px'},{id:'12px',label:'12 px'},
                {id:'16px',label:'16 px'},{id:'20px',label:'20 px'},{id:'24px',label:'24 px'},
                {id:'32px',label:'32 px'},{id:'40px',label:'40 px'},{id:'48px',label:'48 px'},
                {id:'64px',label:'64 px'},{id:'80px',label:'80 px'},{id:'96px',label:'96 px'}
              ]
            },
            {
              property:'padding-top', name:'上內距', type:'select',
              options:[
                {id:'0',label:'0'},{id:'4px',label:'4 px'},{id:'8px',label:'8 px'},
                {id:'12px',label:'12 px'},{id:'16px',label:'16 px'},{id:'20px',label:'20 px'},
                {id:'24px',label:'24 px'},{id:'32px',label:'32 px'},{id:'40px',label:'40 px'},
                {id:'48px',label:'48 px'},{id:'64px',label:'64 px'},{id:'80px',label:'80 px'},
                {id:'96px',label:'96 px'},{id:'120px',label:'120 px'}
              ]
            },
            {
              property:'padding-right', name:'右內距', type:'select',
              options:[
                {id:'0',label:'0'},{id:'4px',label:'4 px'},{id:'8px',label:'8 px'},
                {id:'12px',label:'12 px'},{id:'16px',label:'16 px'},{id:'20px',label:'20 px'},
                {id:'24px',label:'24 px'},{id:'32px',label:'32 px'},{id:'40px',label:'40 px'},
                {id:'48px',label:'48 px'},{id:'64px',label:'64 px'},{id:'80px',label:'80 px'},
                {id:'96px',label:'96 px'},{id:'120px',label:'120 px'}
              ]
            },
            {
              property:'padding-bottom', name:'下內距', type:'select',
              options:[
                {id:'0',label:'0'},{id:'4px',label:'4 px'},{id:'8px',label:'8 px'},
                {id:'12px',label:'12 px'},{id:'16px',label:'16 px'},{id:'20px',label:'20 px'},
                {id:'24px',label:'24 px'},{id:'32px',label:'32 px'},{id:'40px',label:'40 px'},
                {id:'48px',label:'48 px'},{id:'64px',label:'64 px'},{id:'80px',label:'80 px'},
                {id:'96px',label:'96 px'},{id:'120px',label:'120 px'}
              ]
            },
            {
              property:'padding-left', name:'左內距', type:'select',
              options:[
                {id:'0',label:'0'},{id:'4px',label:'4 px'},{id:'8px',label:'8 px'},
                {id:'12px',label:'12 px'},{id:'16px',label:'16 px'},{id:'20px',label:'20 px'},
                {id:'24px',label:'24 px'},{id:'32px',label:'32 px'},{id:'40px',label:'40 px'},
                {id:'48px',label:'48 px'},{id:'64px',label:'64 px'},{id:'80px',label:'80 px'},
                {id:'96px',label:'96 px'},{id:'120px',label:'120 px'}
              ]
            }
          ]
        },

        {
          name:'背景／外觀',
          open:false,
          properties:[
            { property:'background-color', name:'背景顏色', type:'color', default:'#ffffff' },
            {
              property:'background-position', name:'背景位置', type:'select',
              options:[
                {id:'center center',label:'置中'},
                {id:'left top',label:'左上'},
                {id:'center top',label:'上方置中'},
                {id:'right top',label:'右上'},
                {id:'left center',label:'左側置中'},
                {id:'right center',label:'右側置中'},
                {id:'left bottom',label:'左下'},
                {id:'center bottom',label:'下方置中'},
                {id:'right bottom',label:'右下'}
              ]
            },
            {
              property:'background-size', name:'背景尺寸', type:'select',
              options:[
                {id:'auto',label:'原始尺寸'},
                {id:'cover',label:'填滿裁切'},
                {id:'contain',label:'完整顯示'},
                {id:'100% auto',label:'寬度 100%'},
                {id:'auto 100%',label:'高度 100%'},
                {id:'100% 100%',label:'拉滿區塊'}
              ]
            },
            {
              property:'background-repeat', name:'背景重複', type:'select',
              options:[
                {id:'no-repeat',label:'不重複'},
                {id:'repeat',label:'全部重複'},
                {id:'repeat-x',label:'水平重複'},
                {id:'repeat-y',label:'垂直重複'}
              ]
            },
            {
              property:'border-style', name:'框線樣式', type:'select',
              options:[
                {id:'none',label:'無框線'},
                {id:'solid',label:'實線'},
                {id:'dashed',label:'虛線'},
                {id:'dotted',label:'點線'},
                {id:'double',label:'雙線'}
              ]
            },
            {
              property:'border-top-width', name:'上框線', type:'select',
              options:[
                {id:'0',label:'0'},{id:'1px',label:'1 px'},{id:'2px',label:'2 px'},
                {id:'3px',label:'3 px'},{id:'4px',label:'4 px'},{id:'6px',label:'6 px'},
                {id:'8px',label:'8 px'},{id:'10px',label:'10 px'}
              ]
            },
            {
              property:'border-right-width', name:'右框線', type:'select',
              options:[
                {id:'0',label:'0'},{id:'1px',label:'1 px'},{id:'2px',label:'2 px'},
                {id:'3px',label:'3 px'},{id:'4px',label:'4 px'},{id:'6px',label:'6 px'},
                {id:'8px',label:'8 px'},{id:'10px',label:'10 px'}
              ]
            },
            {
              property:'border-bottom-width', name:'下框線', type:'select',
              options:[
                {id:'0',label:'0'},{id:'1px',label:'1 px'},{id:'2px',label:'2 px'},
                {id:'3px',label:'3 px'},{id:'4px',label:'4 px'},{id:'6px',label:'6 px'},
                {id:'8px',label:'8 px'},{id:'10px',label:'10 px'}
              ]
            },
            {
              property:'border-left-width', name:'左框線', type:'select',
              options:[
                {id:'0',label:'0'},{id:'1px',label:'1 px'},{id:'2px',label:'2 px'},
                {id:'3px',label:'3 px'},{id:'4px',label:'4 px'},{id:'6px',label:'6 px'},
                {id:'8px',label:'8 px'},{id:'10px',label:'10 px'}
              ]
            },
            { property:'border-color', name:'框線顏色', type:'color', default:'#d9d9d9' },
            {
              property:'border-radius', name:'圓角', type:'select',
              options:[
                {id:'0',label:'直角'},
                {id:'4px',label:'4 px'},
                {id:'8px',label:'8 px'},
                {id:'12px',label:'12 px'},
                {id:'16px',label:'16 px'},
                {id:'20px',label:'20 px'},
                {id:'24px',label:'24 px'},
                {id:'32px',label:'32 px'},
                {id:'40px',label:'40 px'},
                {id:'50%',label:'圓形 50%'},
                {id:'9999px',label:'膠囊形'}
              ]
            },
            {
              property:'opacity', name:'透明度', type:'select',
              options:[
                {id:'1',label:'100%'},
                {id:'.9',label:'90%'},
                {id:'.8',label:'80%'},
                {id:'.7',label:'70%'},
                {id:'.6',label:'60%'},
                {id:'.5',label:'50%'},
                {id:'.4',label:'40%'},
                {id:'.3',label:'30%'},
                {id:'.2',label:'20%'},
                {id:'.1',label:'10%'},
                {id:'0',label:'0%｜完全透明'}
              ]
            },
            {
              property:'box-shadow', name:'區塊陰影', type:'select',
              options:[
                {id:'none',label:'無陰影'},
                {id:'0 2px 8px rgba(0,0,0,.08)',label:'極淡陰影'},
                {id:'0 4px 14px rgba(0,0,0,.12)',label:'柔和陰影'},
                {id:'0 8px 24px rgba(0,0,0,.16)',label:'中等陰影'},
                {id:'0 14px 36px rgba(0,0,0,.2)',label:'明顯陰影'},
                {id:'0 20px 60px rgba(0,0,0,.24)',label:'大型浮起'},
                {id:'inset 0 0 0 1px rgba(0,0,0,.12)',label:'內框陰影'}
              ]
            }
          ]
        },

        {
          name:'Flex／Grid 排版',
          open:false,
          properties:[
            {
              property:'flex-direction', name:'排列方向', type:'select',
              options:[
                {id:'row',label:'橫向'},
                {id:'column',label:'直向'},
                {id:'row-reverse',label:'橫向反轉'},
                {id:'column-reverse',label:'直向反轉'}
              ]
            },
            {
              property:'flex-wrap', name:'換行方式', type:'select',
              options:[
                {id:'nowrap',label:'不換行'},
                {id:'wrap',label:'自動換行'},
                {id:'wrap-reverse',label:'反向換行'}
              ]
            },
            {
              property:'justify-content', name:'主軸對齊', type:'select',
              options:[
                {id:'flex-start',label:'靠開頭'},
                {id:'center',label:'置中'},
                {id:'flex-end',label:'靠結尾'},
                {id:'space-between',label:'兩端分散'},
                {id:'space-around',label:'環繞分散'},
                {id:'space-evenly',label:'平均分散'}
              ]
            },
            {
              property:'align-items', name:'交叉軸對齊', type:'select',
              options:[
                {id:'stretch',label:'拉伸'},
                {id:'flex-start',label:'靠開頭'},
                {id:'center',label:'置中'},
                {id:'flex-end',label:'靠結尾'},
                {id:'baseline',label:'文字基準線'}
              ]
            },
            {
              property:'align-content', name:'多行對齊', type:'select',
              options:[
                {id:'stretch',label:'拉伸'},
                {id:'flex-start',label:'靠開頭'},
                {id:'center',label:'置中'},
                {id:'flex-end',label:'靠結尾'},
                {id:'space-between',label:'兩端分散'},
                {id:'space-around',label:'環繞分散'}
              ]
            },
            {
              property:'gap', name:'項目間距', type:'select',
              options:[
                {id:'0',label:'0'},
                {id:'4px',label:'4 px'},
                {id:'8px',label:'8 px'},
                {id:'12px',label:'12 px'},
                {id:'16px',label:'16 px'},
                {id:'20px',label:'20 px'},
                {id:'24px',label:'24 px'},
                {id:'32px',label:'32 px'},
                {id:'40px',label:'40 px'},
                {id:'48px',label:'48 px'},
                {id:'64px',label:'64 px'}
              ]
            },
            {
              property:'grid-template-columns', name:'網格欄數', type:'select',
              options:[
                {id:'none',label:'無'},
                {id:'1fr',label:'1 欄'},
                {id:'repeat(2, 1fr)',label:'2 欄'},
                {id:'repeat(3, 1fr)',label:'3 欄'},
                {id:'repeat(4, 1fr)',label:'4 欄'},
                {id:'repeat(5, 1fr)',label:'5 欄'},
                {id:'repeat(6, 1fr)',label:'6 欄'},
                {id:'1fr 2fr',label:'1：2'},
                {id:'2fr 1fr',label:'2：1'},
                {id:'repeat(auto-fit, minmax(220px, 1fr))',label:'自動響應 220px'}
              ]
            },
            {
              property:'grid-template-rows', name:'網格列數', type:'select',
              options:[
                {id:'none',label:'自動'},
                {id:'auto',label:'1 列自動'},
                {id:'repeat(2, auto)',label:'2 列'},
                {id:'repeat(3, auto)',label:'3 列'},
                {id:'repeat(4, auto)',label:'4 列'},
                {id:'repeat(2, 1fr)',label:'2 列等高'},
                {id:'repeat(3, 1fr)',label:'3 列等高'}
              ]
            }
          ]
        },

        {
          name:'圖片／媒體',
          open:false,
          properties:[
            {
              property:'object-fit', name:'圖片填滿方式', type:'select',
              options:[
                {id:'fill',label:'拉伸填滿'},
                {id:'cover',label:'填滿裁切'},
                {id:'contain',label:'完整顯示'},
                {id:'none',label:'原始尺寸'},
                {id:'scale-down',label:'自動縮小'}
              ]
            },
            {
              property:'object-position', name:'圖片焦點位置', type:'select',
              options:[
                {id:'center center',label:'置中'},
                {id:'left top',label:'左上'},
                {id:'center top',label:'上方置中'},
                {id:'right top',label:'右上'},
                {id:'left center',label:'左側置中'},
                {id:'right center',label:'右側置中'},
                {id:'left bottom',label:'左下'},
                {id:'center bottom',label:'下方置中'},
                {id:'right bottom',label:'右下'}
              ]
            },
            {
              property:'aspect-ratio', name:'圖片比例', type:'select',
              options:[
                {id:'auto',label:'自動'},
                {id:'1 / 1',label:'1：1 正方形'},
                {id:'4 / 3',label:'4：3'},
                {id:'3 / 2',label:'3：2'},
                {id:'16 / 9',label:'16：9'},
                {id:'9 / 16',label:'9：16 直式'},
                {id:'21 / 9',label:'21：9 超寬'}
              ]
            }
          ]
        }
      ]
    }
  });

  function setStatus(msg) { statusText.textContent = msg; }

  // -------- V8.5 IndexedDB 草稿儲存 --------
  // 舊版把整個網站（含 base64 圖片）塞進 localStorage，約 5~10MB 就可能爆掉。
  // V8.5 改用 IndexedDB；容量大很多，且發布不會因草稿儲存失敗而中止。
  const DRAFT_DB_NAME = 'chinon-editor-drafts';
  const DRAFT_DB_VERSION = 1;
  const DRAFT_STORE = 'drafts';
  const DRAFT_KEY = 'chinon-v85-project';
  const LEGACY_DRAFT_KEY = 'chinon-warm-v72';

  function openDraftDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DRAFT_DB_NAME, DRAFT_DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(DRAFT_STORE)) {
          db.createObjectStore(DRAFT_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('IndexedDB 無法開啟'));
    });
  }

  async function idbGetDraft() {
    const db = await openDraftDb();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(DRAFT_STORE, 'readonly');
        const req = tx.objectStore(DRAFT_STORE).get(DRAFT_KEY);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error || new Error('讀取草稿失敗'));
      });
    } finally {
      db.close();
    }
  }

  async function idbPutDraft(data) {
    const db = await openDraftDb();
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(DRAFT_STORE, 'readwrite');
        tx.objectStore(DRAFT_STORE).put(data, DRAFT_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error || new Error('儲存草稿失敗'));
        tx.onabort = () => reject(tx.error || new Error('儲存草稿被中止'));
      });
    } finally {
      db.close();
    }
  }

  async function saveDraft({silent=false}={}) {
    const data = editor.getProjectData();
    await idbPutDraft(data);
    editor.clearDirtyCount();
    if (!silent) {
      setStatus('草稿已儲存在這台電腦（IndexedDB）。尚未發布到正式網站。');
    }
    return true;
  }

  async function restoreDraft() {
    const draft = await idbGetDraft();
    if (!draft) return false;
    editor.loadProjectData(draft);
    editor.clearDirtyCount();
    return true;
  }

  async function migrateLegacyDraftIfAvailable() {
    const raw = localStorage.getItem(LEGACY_DRAFT_KEY);
    if (!raw) return false;

    try {
      const data = JSON.parse(raw);
      editor.loadProjectData(data);
      await saveDraft({silent:true});
      // 成功搬到 IndexedDB 後才刪舊大型草稿，釋放 localStorage。
      localStorage.removeItem(LEGACY_DRAFT_KEY);
      localStorage.removeItem(INIT_KEY);
      return true;
    } catch (error) {
      console.warn('舊草稿搬移失敗', error);
      return false;
    }
  }

  let draftSaveTimer = null;
  function scheduleDraftSave() {
    clearTimeout(draftSaveTimer);
    draftSaveTimer = setTimeout(() => {
      saveDraft({silent:true}).catch(error => {
        console.warn('自動儲存草稿失敗', error);
        setStatus(`自動儲存失敗：${error.message}。可先下載備份 ZIP。`);
      });
    }, 1000);
  }

  async function importBackupFile(file) {
    if (!file) return;

    let projectData = null;

    if (/\.zip$/i.test(file.name) || file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
      const zip = await JSZip.loadAsync(file);
      const backup = zip.file('editor-backup.json');
      if (!backup) throw new Error('ZIP 裡找不到 editor-backup.json');
      projectData = JSON.parse(await backup.async('text'));
    } else {
      projectData = JSON.parse(await file.text());
    }

    if (!projectData || typeof projectData !== 'object') {
      throw new Error('備份內容格式不正確');
    }

    editor.loadProjectData(projectData);
    await saveDraft({silent:true});
    refreshPages();
    editor.refresh();
    setStatus('備份已匯入並儲存。');
  }


  // -------- V8.1 顏色色塊選擇 --------
  function enhanceColorPickers() {
    requestAnimationFrame(() => {
      document.querySelectorAll('.gjs-field-color input[type="color"], .gjs-field-color input').forEach(input => {
        input.setAttribute('title', '點色塊直接選顏色');
      });
    });
  }


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

  function restoreComponentPositionFromSnapshot(c) {
    const attrs = c.getAttributes?.() || {};
    if (!attrs[SNAPSHOT_ATTR]) return false;

    let snap;
    try {
      snap = JSON.parse(decodeURIComponent(attrs[SNAPSHOT_ATTR]));
    } catch {
      return false;
    }

    const style = { ...(c.getStyle?.() || {}) };
    ['position','top','right','bottom','left','transform'].forEach(k => {
      const v = snap[k];
      if (v === null || v === '') delete style[k];
      else style[k] = v;
    });

    c.setStyle(style);
    c.removeAttributes(SNAPSHOT_ATTR);
    return true;
  }

  function walkComponents(component, fn) {
    if (!component) return;
    fn(component);
    const children = component.components?.();
    if (!children) return;
    const list = children.models || children;
    if (typeof list.forEach === 'function') {
      list.forEach(child => walkComponents(child, fn));
    }
  }

  function resetCurrentPagePositions() {
    const page = currentPage();
    const root = page?.getMainComponent?.();
    if (!root) {
      setStatus('找不到目前頁面。');
      return;
    }

    if (!confirm(
      '這會一次恢復「本頁所有曾經用自由移動拖過的元件」到第一次拖動前的位置。\\n\\n' +
      '文字、字型、大小、顏色、圖片都不會重置。\\n\\n確定繼續？'
    )) return;

    let count = 0;
    walkComponents(root, c => {
      if (restoreComponentPositionFromSnapshot(c)) count += 1;
    });

    editor.refresh();
    scheduleDraftSave();

    if (count > 0) {
      setStatus(`本頁已恢復 ${count} 個自由移動元件的位置。確認正常後再全站同步發布。`);
    } else {
      setStatus('找不到可恢復的移動紀錄。若之前已重新載入正式網站，需從 GitHub History 還原上一版。');
    }
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

    const el = c.getEl?.();
    const doc = editor.Canvas.getDocument?.();
    if (!el || !doc) return;

    const canvasWidth = doc.documentElement?.clientWidth || 1;
    const rect = el.getBoundingClientRect();
    const childCollection = c.components?.();
    const childCount = childCollection?.length || childCollection?.models?.length || 0;
    const tag = String(c.get('tagName') || '').toLowerCase();
    const isLargeStructure =
      childCount > 0 &&
      (rect.width >= canvasWidth * 0.68 || ['header','nav','main','section','footer'].includes(tag));

    if (isLargeStructure) {
      const ok = confirm(
        '⚠️ 你現在選到大型版面容器。\n\n' +
        '拖動它會連同裡面的文字、圖片、按鈕一起移位，正式網站也會跟著跑掉。\n\n' +
        '確定要移動整個區塊嗎？'
      );
      if (!ok) {
        setStatus('已取消自由移動。請改選裡面的文字、圖片或較小元件。');
        return;
      }
    }

    ensureMoveSnapshot(c);

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
    try {
      await saveDraft({silent:true});
    } catch (error) {
      console.warn('重新載入後草稿儲存失敗', error);
    }
    refreshPages();
    setStatus('V8.7 溫暖生活版已載入：首頁、關於奇農、製茶堅持、GABA桑茶、秘魯瑪卡、檢測證書、相關資訊、聯繫我們。');
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



  // -------- V8.0 full-sync asset snapshot helpers --------
  async function dataUrlToAsset(dataUrl, suggestedBase='image') {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const ext = extFromMime(blob.type || 'application/octet-stream');
    return {
      mime: blob.type || 'application/octet-stream',
      ext,
      base64: bytesToBase64(bytes),
      base: suggestedBase
    };
  }

  function dataUrlRegex() {
    return /url\(\s*(['"]?)(data:[^)'"]+)\1\s*\)/gi;
  }

  async function replaceDataUrlsInCss(cssText, files, counterRef) {
    let css = String(cssText || '');
    const matches = [...css.matchAll(dataUrlRegex())];

    for (const match of matches) {
      const whole = match[0];
      const quote = match[1] || '';
      const dataUrl = match[2];
      const asset = await dataUrlToAsset(dataUrl, 'background');
      const name = `background-${counterRef.value++}.${asset.ext}`;
      const path = `assets/uploads/${name}`;
      files.set(path, { content: asset.base64, encoding:'base64' });
      css = css.replace(whole, `url(${quote}${path}${quote})`);
    }

    return css;
  }

  async function replaceDataUrlsInDocument(doc, files, counterRef) {
    // <img src="data:...">
    for (const img of [...doc.body.querySelectorAll('img[src^="data:"]')]) {
      const src = img.getAttribute('src');
      const asset = await dataUrlToAsset(src, 'image');
      const name = `image-${counterRef.value++}.${asset.ext}`;
      const path = `assets/uploads/${name}`;
      files.set(path, { content: asset.base64, encoding:'base64' });
      img.setAttribute('src', path);
    }

    // poster="data:..."
    for (const el of [...doc.body.querySelectorAll('[poster^="data:"]')]) {
      const src = el.getAttribute('poster');
      const asset = await dataUrlToAsset(src, 'poster');
      const name = `poster-${counterRef.value++}.${asset.ext}`;
      const path = `assets/uploads/${name}`;
      files.set(path, { content: asset.base64, encoding:'base64' });
      el.setAttribute('poster', path);
    }

    // inline style background-image:url(data:...)
    for (const el of [...doc.body.querySelectorAll('[style*="data:"]')]) {
      let styleText = el.getAttribute('style') || '';
      const matches = [...styleText.matchAll(dataUrlRegex())];

      for (const match of matches) {
        const whole = match[0];
        const quote = match[1] || '';
        const dataUrl = match[2];
        const asset = await dataUrlToAsset(dataUrl, 'background');
        const name = `background-${counterRef.value++}.${asset.ext}`;
        const path = `assets/uploads/${name}`;
        files.set(path, { content: asset.base64, encoding:'base64' });
        styleText = styleText.replace(whole, `url(${quote}${path}${quote})`);
      }

      el.setAttribute('style', styleText);
    }

    // srcset data urls (rare, but keep complete)
    for (const el of [...doc.body.querySelectorAll('[srcset*="data:"]')]) {
      const raw = el.getAttribute('srcset') || '';
      const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
      const rebuilt = [];

      for (const part of parts) {
        const bits = part.split(/\s+/);
        const src = bits.shift() || '';
        if (src.startsWith('data:')) {
          const asset = await dataUrlToAsset(src, 'responsive');
          const name = `responsive-${counterRef.value++}.${asset.ext}`;
          const path = `assets/uploads/${name}`;
          files.set(path, { content: asset.base64, encoding:'base64' });
          rebuilt.push([path, ...bits].join(' '));
        } else {
          rebuilt.push(part);
        }
      }

      el.setAttribute('srcset', rebuilt.join(', '));
    }
  }

  async function getPreservedMainJs() {
    // 編輯器本身沒有站台 JS 編輯器，因此發布時保留正式網站目前的 main.js，
    // 避免每次發布把原本功能清空。
    try {
      return await fetchText(`../main.js?t=${Date.now()}`);
    } catch {
      return '// CHINON site script\n';
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
    publishProgress('準備全站同步發布。所有頁面、樣式與新圖片會在同一個 GitHub Commit 一次更新。');
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
    const assetCounter = { value: 1 };
    const assetVersion = Date.now().toString(36);

    // 1) 所有頁面：文字、連結、圖片、inline style 都從目前編輯器狀態輸出
    for (const page of editor.Pages.getAll()) {
      const root = page.getMainComponent();
      let html = cleanSnapshotAttrs(editor.getHtml({component:root}));
      const doc = new DOMParser().parseFromString(`<body>${html}</body>`,'text/html');

      await replaceDataUrlsInDocument(doc, files, assetCounter);

      html = doc.body.innerHTML;

      files.set(pageFile(page), {
        content: docForPage(page, html, assetVersion),
        encoding:'utf-8'
      });
    }

    // 2) 全站 CSS：字型、大小、粗細、字距、行高、顏色、位置、RWD 等一次同步
    let css = editor.getCss() || '';

    if (!css.includes('fonts.googleapis.com')) {
      css = `@import url('${CFG.fontUrl}');\n\n` + css;
    }

    // CSS 裡若有 data: 背景圖，也真正存成 assets/uploads 檔案
    css = await replaceDataUrlsInCss(css, files, assetCounter);

    files.set('styles.css', {
      content: css,
      encoding:'utf-8'
    });

    // 3) 保留正式網站既有 main.js，不再用空白 JS 覆蓋
    files.set('main.js', {
      content: await getPreservedMainJs(),
      encoding:'utf-8'
    });

    return {
      files,
      assetVersion,
      summary: {
        pages: editor.Pages.getAll().length,
        uploads: [...files.keys()].filter(path => path.startsWith('assets/uploads/')).length
      }
    };
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

    if (!confirm(`確定將目前整個網站一次同步發布到 ${owner}/${repo} 的 ${branch} 分支？\n\n發布後 GitHub Pages 會重新部署正式網站。`)) {
      return;
    }

    button.disabled = true;

    try {
      publishProgress('1/6 正在備份目前編輯內容…');
      try {
        await saveDraft({silent:true});
      } catch (draftError) {
        // 草稿儲存失敗不能阻止正式發布。
        console.warn('草稿儲存失敗，但繼續發布', draftError);
        publishProgress(`草稿儲存失敗（${draftError.message}），但會繼續發布目前畫面內容…`);
      }

      publishProgress('2/6 正在整理網站檔案…');
      const snapshot = await buildPublishFiles();
      const files = snapshot.files;

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

      publishProgress(`4/6 正在同步 ${snapshot.summary.pages} 個頁面與 ${snapshot.summary.uploads} 個新圖片資源…`);
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
        `全站同步發布成功！
頁面：${snapshot.summary.pages}
新圖片資源：${snapshot.summary.uploads}
Commit：${commit.sha.slice(0,7)}

文字、字型、大小、粗細、間距、顏色、版面、CSS 與新圖片已在同一個 Commit 一次送出。
GitHub Pages 仍需要一點時間重新部署。`,
        'ok'
      );
      setStatus('全站已一次送出 GitHub：頁面、CSS、字型樣式與新圖片都在同一個 Commit。');

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

  function docForPage(page, bodyHtml, assetVersion='') {
    const title = page.get('name') || 'CHINON 奇農';
    const suffix = assetVersion ? `?v=${encodeURIComponent(assetVersion)}` : '';
    return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</title>
  <link rel="stylesheet" href="styles.css${suffix}">
</head>
<body>
${bodyHtml}
<script src="main.js${suffix}"></script>
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
    const assetVersion = Date.now().toString(36);

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
      zip.file(pageFile(page), docForPage(page, html, assetVersion));
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
  $('#btnResetPagePosition').addEventListener('click',resetCurrentPagePositions);
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
    try {
      await saveDraft();
    } catch (error) {
      console.error(error);
      setStatus(`草稿儲存失敗：${error.message}。請先下載備份 ZIP。`);
      alert(`草稿儲存失敗：${error.message}\n\n請先按「下載備份 ZIP」保留目前修改。`);
    }
  });

  $('#btnReload').addEventListener('click',()=>loadLive({ask:true}));
  $('#btnPublish').addEventListener('click',openPublishDialog);
  $('#btnDoPublish').addEventListener('click',publishToGithub);
  $('#btnForgetToken').addEventListener('click',()=>{
    sessionStorage.removeItem(PUBLISH_TOKEN_KEY);
    $('#publishToken').value = '';
    publishProgress('目前分頁中的 GitHub Token 已清除。');
  });
  $('#btnImportBackup').addEventListener('click',()=>$('#backupFileInput').click());
  $('#backupFileInput').addEventListener('change',async(event)=>{
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setStatus('正在匯入備份…');
      await importBackupFile(file);
    } catch (error) {
      console.error(error);
      setStatus(`匯入備份失敗：${error.message}`);
      alert(`匯入備份失敗：${error.message}`);
    } finally {
      event.target.value = '';
    }
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
    enhanceColorPickers();
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
    enhanceColorPickers();
    ensureCanvasBase();

    let loadedDraft = false;

    try {
      loadedDraft = await restoreDraft();
    } catch (error) {
      console.warn('IndexedDB 草稿讀取失敗', error);
    }

    if (!loadedDraft) {
      try {
        loadedDraft = await migrateLegacyDraftIfAvailable();
      } catch (error) {
        console.warn('舊草稿搬移失敗', error);
      }
    }

    if (!loadedDraft) {
      await loadLive({ask:false});
    }

    // V8.6 不再使用舊版 localStorage 草稿標記。
    try { localStorage.removeItem(INIT_KEY); } catch {}

    refreshPages();

    // 自動草稿改存 IndexedDB。
    editor.on('update', scheduleDraftSave);

    setStatus(`${RUNTIME_BUILD} 已載入。若版面被自由移動拖亂，可按「重置本頁位置」一次恢復。`);
  });
})();
