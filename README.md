# iHeart 心超互動示範

繁體中文、Vue 3 + TypeScript + Vite + Tailwind CSS 4 的純靜態演示台，使用 pnpm 管理依賴。兩類預置影片由同一 model25 checkpoint 的逐病例結果驅動：泵血功能與心臟尺寸。瀏覽器不執行模型推理，亦不接收任意影片上傳。

## 本地啟動

需要 Node.js 20.19+ 或 22.12+；準備影片時另需 `ffmpeg`、`ffprobe`。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

開啟 [本地開發版](http://127.0.0.1:5173/)。首頁以 1920 × 1080 單屏展示 EF、EDV、ESV、IVSd、LVIDd、LVIDs 六個量測入口，分別連到六個已授權示範病例。每張卡片展示實際量測畫面、影片定位時間、數值及通俗解釋；點入後直接選中對應指標，查看影片、關鍵時刻、心室分割及量測位置，不需要滾動頁面。

首頁預設循環演示，每 9 秒切換下一項量測：先播放真實影片，再定位到該量測的證據幀，顯示時間、輪廓或量測端點。可手動選項、停止演示或重播影片。詳情頁從所選指標開始，每 6 秒切換下一項：功能輪播 EF／EDV／ESV；尺寸輪播 IVSd／LVIDd／LVIDs／LVPWd。每項先展示量測畫面，再播放 2 秒影片。操作指標、量測畫面或播放器會切回手動探索；右上方可重新開始演示。

演示與視覺驗收以 1920 × 1080 桌面畫布為準；系統設定減少動效時不自動開始演示。

首頁與詳情頁統一使用淺色醫療介面、藍綠品牌色及白色量測卡片。深色僅用於超聲影片和關鍵畫面的影像區域；首頁保持全寬單屏布局。

```bash
pnpm check:data
pnpm build
pnpm preview
```

開啟 [本地靜態版](http://127.0.0.1:4173/)。`dist/` 是可由任何本地靜態 HTTP 伺服器提供的完整構建；請勿直接以 `file://` 開啟。執行 `pnpm build` 不會部署到 GitHub。

保持靜態預覽運行，在另一個終端執行 `pnpm check:browser`，會以已安裝的 Google Chrome 檢查六個指標入口、自動影片播放與選幀、指標直達連結、輪廓／端點顯示、鍵盤、減少動效及單屏排版，並保存本地截圖。

## Tailwind 樣式

`src/tailwind.css` 為唯一入口：`@theme` 管理字體及品牌色，Vue 元件模板直接使用 Tailwind utility classes 組成版面、卡片、狀態與互動效果，包括 range slider 的原生偽元素。CSS 只保留全域 reset、動畫關鍵幀及減少動效設定。病例路由、首頁、影片定位展示、量測卡片與詳情面板各自封裝為元件。

本網站有獨立 `pnpm-workspace.yaml` 與 `pnpm-lock.yaml`，保持與 Notes vault 及其他 PPT 專案的依賴邊界。

## 素材與重建

來源及坐標／單位規則見 [素材說明](docs/demo-materials.md)。若素材未準備，頁面會提供載入提示。

1. 在論文目錄使用既有 `.scripts/ct-heart-remote/pull`，將所選 LVH 原始影片拉到本網站 `private-source/`；不直接使用 SSH。
1. 保留项目中已有的 model25 `predictions.csv` 與 Dynamic 影片。
1. 在本網站執行 `pnpm prepare:demo`，轉換 MP4、生成封面、影片縮圖及六個病例資料。

`public/demo/` 是已授權的可公開示範素材；`private-source/` 與包含病例素材的 `dist/` 仍保留在本地並排除 Git 提交。預覽截圖存於 `private-source/previews/`。

## GitHub Pages 發布

公開演示網址：[iHeart](https://iheart-3decho.github.io/)。六個病例已獲使用者確認可公開展示。

`.github/workflows/pages.yml` 在 `main` 推送後驗證病例資料、檢查 TypeScript 並構建 Vue 網站，再將 `dist/` 作為 GitHub Pages artifact 發布。也可透過 GitHub Actions 的手動執行入口重新發布。Pages 的發布來源使用 **GitHub Actions**，不直接發布倉庫根目錄。

發布內容包括前端與 `public/demo/` 中的 MP4、縮圖及預置結果。`private-source/`、原始研究 AVI 和本地驗收截圖不進入發布 artifact。

部署後可驗證公開網站：

```bash
DEMO_URL=https://iheart-3decho.github.io/ pnpm check:browser
```
