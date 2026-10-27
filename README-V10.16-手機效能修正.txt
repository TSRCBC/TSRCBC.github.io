CHINON V10.16 MOBILE PERFORMANCE｜手機效能修正版
================================================

本版依據你提供的 V10.15 完整專案直接修改。

已完成
------
1. Google Fonts
   - 移除 styles.css 重複的 Google Fonts @import。
   - 公開頁面由 7 個字型家族縮為網站實際使用的 4 個：
     Noto Sans TC / Noto Serif TC / Klee One / LXGW WenKai TC。
   - 字型 CSS 改為非阻塞載入（media=print + onload），先顯示頁面，再換成品牌字型。
   - 保留 fonts.googleapis.com / fonts.gstatic.com 預連線。

2. 手機 Header
   - <=680px 關閉 sticky Header 的 backdrop-filter blur。
   - 桌機版 blur 效果維持原設定。

3. 圖片
   - 僅重壓目前 8 個正式頁面真正有使用到的 WebP。
   - 圖片路徑、尺寸、版型全部不變。
   - WebP 品質設定 82，避免肉眼明顯失真。
   - 其他未使用素材不刪除，避免影響後台未來編輯。

4. 後台
   - BUILD 更新為 V10.16 MOBILE PERFORMANCE。
   - FONT_URL 同步更新，避免之後發布又把 7 字型設定寫回去。
   - ensureFontLink / ensurePerformanceHints 同步保留 V10.16 載入方式。
   - editor.js / editor.css cache-busting 由 v=1150 更新到 v=1160。

沒有修改
--------
- 網站文字內容
- 頁面導覽網址
- GA4 Measurement ID：G-0HFR5HDN82
- 既有動畫資料與動畫設定
- Wix 檢測證書圖片來源
- GitHub 發布流程
- 後台帳密

圖片統計
--------
目前正式 8 頁使用的本機 WebP：
- 修改前：6.06 MB
- 修改後：4.02 MB
- 減少：33.6%

注意
----
assets/uploads 整個資料夾仍然很大，因為保留了過去版本與未使用素材。
這些「未被 HTML 引用」的檔案不會因為只是存在 GitHub 就全部下載到訪客手機，
因此本版不冒險刪除它們。

建議上線流程
------------
1. 先備份你原本 V10.15 ZIP。
2. 將本 ZIP 解壓。
3. 把資料夾內所有檔案覆蓋到 TSRCBC.github.io repository 的 main branch。
4. GitHub Pages 更新後，手機使用無痕模式測試。
5. 依序切換 8 頁至少兩輪，比較第一輪與快取後第二輪速度。
