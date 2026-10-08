奇農 CHINON｜免費 GrapesJS 編輯器 V2
======================================

這版解決什麼？
--------------
你不需要每次再改 HTML/CSS 才能移動元件。

V2 有兩種移動：

1. ↔ 微調拖動（平常請用這個）
   - 保留 Flex / Grid
   - 使用 translate 方式拖動
   - 比較不會破壞手機版
   - 文字、圖片、卡片、整個小區塊都適合

2. ✥ 自由定位（少量使用）
   - 用在 Hero 大標、裝飾圖、浮動按鈕
   - 可以像自由畫布那樣移動
   - 編輯器會自動讓父層成為定位基準
   - 不建議拿來拖整個導覽列或整組產品 Grid

另外有：
- 恢復原位
- 上一層
- 下一層
- 最上層
- HTML / CSS 免費編輯
- 中文字型
- 文字陰影 / Box Shadow
- 桌機 / 平板 / 手機
- 本機自動儲存
- 下載網站 ZIP

==================================================
最簡單安裝方法
==================================================

不用重做目前正式網站。

你的 GitHub 原本保持：
TSRCBC.github.io/
  index.html
  about.html
  craft.html
  gaba.html
  maca.html
  certificates.html
  info.html
  contact.html
  styles.css
  main.js
  assets/

只要新增：
TSRCBC.github.io/
  editor/
    index.html
    editor.css
    editor.js

做法：
1. 解壓縮這個 ZIP。
2. GitHub 打開 TSRCBC.github.io 儲存庫。
3. Add file → Upload files。
4. 把 ZIP 裡面的 editor 資料夾內容放到 GitHub 的 editor/ 資料夾。
5. Commit changes。
6. 等 GitHub Pages 更新。
7. 打開：
   https://tsrcbc.github.io/editor/

==================================================
平常操作
==================================================

改文字/字型：
點文字 → 右側「字型與文字」。

安全移動：
點元件 → 按「↔ 微調拖動」→ 直接拖。

真正自由定位：
點元件 → 按「✥ 自由定位」→ 直接拖。
只建議 Hero 標題、裝飾物、浮動按鈕使用。

跑到圖片下面：
選元件 →「上一層」或「最上層」。

拖錯：
選元件 →「恢復原位」。

原始碼：
按「HTML / CSS」。
這個是你自己的編輯器，不走 Grapes Studio Pro Code 付費牆。

完成後：
按「下載網站 ZIP」。
再到 GitHub 根目錄：
Add file → Upload files → 覆蓋 HTML + styles.css → Commit。

==================================================
重要
==================================================

- 「儲存」只存在你目前這台電腦的瀏覽器。
- 「重新載入網站」會重新抓 GitHub Pages 上的正式版，會覆蓋尚未匯出的本機修改。
- /editor/ 不含 GitHub Token，所以不會讓公開訪客直接改你的 GitHub。
- V2 第一次載入時會保留你目前正式網站 CSS，只移除首頁兩個已知會鎖死字型的舊 ID font-family 規則。
