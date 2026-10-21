# iHeart 心臟超聲分析工作站

繁體中文、Vue 3 + TypeScript + Vite + Tailwind CSS 4 的純靜態臨床工作站演示版，使用 pnpm 管理依賴。兩類預置影片由同一 model25 checkpoint 的逐病例結果驅動：泵血功能與心臟尺寸。瀏覽器不執行模型推理，亦不接收任意影片上傳。

展台現有六個病例、七項指標輪播；EDV／ESV 入口已換成較高解析度的 EchoXFlow 影片。每項先播放完整影片，再顯示定位畫面與實際輪廓／量測線。點「開始體驗」即固定使用當時病例。來源、逐項配置與核對方式見 [病例庫說明](docs/case-library.md)。

## 本地啟動

預設 `#/` 與 `#/clinical` 為臨床分析工作站：檢查列表、大幅閱片、量測表、關鍵幀與報告預覽。選擇病例後，點「AI 分析」再點「生成報告」即可完成示範；確認量測為可選操作。操作方式及驗收見 [工作站說明](docs/clinical-workstation.md)。本輪新版僅供本地審查，沒有更新線上網站或演示機。

舊展台完整保留在 `#/experience`；原六入口展示在 `#/showcase`，原有 `#/case/…` 詳情連結繼續有效。舊展台操作、資料來源與連續運行驗收詳見 [展台操作說明](docs/booth-operation.md)。

需要 Node.js 20.19+ 或 22.12+；準備影片時另需 `ffmpeg`、`ffprobe`。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

開啟 [本地開發版](http://127.0.0.1:5173/)。新版工作站適配 1920 × 1080 單屏，預設播放 EchoXFlow 功能病例，按既有八段配置自動展示。每段先播放原片 5 秒，展示量測 3 秒，再在右側原位展示報告 4 秒；影片及證據圖持續可見，不用開關彈窗。點擊或鍵盤操作即接管。120 秒無人操作後清除本輪核查狀態、關閉報告並恢復輪播。

以下為保留的 `#/showcase` 與病例詳情操作：六入口展示 EF、EDV、ESV、IVSd、LVIDd、LVIDs，分別連到六個已授權示範病例。每張卡片展示實際量測畫面、影片定位時間、數值及通俗解釋；點入後直接選中對應指標，查看影片、關鍵時刻、心室分割及量測位置，不需要滾動頁面。

展示頁預設循環演示，每 9 秒切換下一項量測：先播放真實影片，再定位到該量測的證據幀，顯示時間、輪廓或量測端點。可手動選項、停止演示或重播影片。詳情頁從所選指標開始，每 6 秒切換下一項：功能輪播 EF／EDV／ESV；尺寸輪播 IVSd／LVIDd／LVIDs／LVPWd。每項先展示量測畫面，再播放 2 秒影片。操作指標、量測畫面或播放器會切回手動探索；右上方可重新開始演示。

演示與視覺驗收以 1920 × 1080 桌面畫布為準；系統設定減少動效時不自動開始演示。

首頁與詳情頁統一使用淺色醫療介面、藍綠品牌色及白色量測卡片。深色僅用於超聲影片和關鍵畫面的影像區域；首頁保持全寬單屏布局。

```bash
pnpm check:data
pnpm build
pnpm preview
```

開啟 [本地靜態版](http://127.0.0.1:4173/)。`dist/` 是可由任何本地靜態 HTTP 伺服器提供的完整構建；請勿直接以 `file://` 開啟。執行 `pnpm build` 不會部署到 GitHub。

STG 展台已部署到 [158.132.74.7:8080](http://158.132.74.7:8080/)，使用 Caddy 與 Firefox 全屏展示。更新路徑、服務管理及實屏驗證見 [STG 部署說明](docs/stg-deployment.md)。

保持靜態預覽運行，在另一個終端執行 `pnpm check:browser`，會以已安裝的 Google Chrome 檢查六個指標入口、自動影片播放與選幀、指標直達連結、輪廓／端點顯示、鍵盤、減少動效及單屏排版，並保存本地截圖。

`pnpm check:clinical` 檢查新版工作站六例完整流程、八段自動演示、精確證據幀與坐標、報告、閒置復位、減少動效、故障重試及反覆切換資源。`pnpm check:library` 檢查舊展台待機輪播、所有病例進入互動後的固定與對照；`pnpm check:experience` 包含舊展台 100 次互動／復位檢查。

## Tailwind 樣式

`src/tailwind.css` 為唯一入口：`@theme` 管理字體及品牌色，Vue 元件模板直接使用 Tailwind utility classes 組成版面、卡片、狀態與互動效果，包括 range slider 的原生偽元素。CSS 只保留全域 reset、動畫關鍵幀及減少動效設定。病例路由、首頁、影片定位展示、量測卡片與詳情面板各自封裝為元件。

本網站有獨立 `pnpm-workspace.yaml` 與 `pnpm-lock.yaml`，保持與 Notes vault 及其他 PPT 專案的依賴邊界。

## 素材與重建

來源及坐標／單位規則見 [素材說明](docs/demo-materials.md)。若素材未準備，頁面會提供載入提示。

1. 在論文目錄使用既有 `.scripts/ct-heart-remote/pull`，將所選 LVH 原始影片拉到本網站 `private-source/`；不直接使用 SSH。
1. 保留项目中已有的 model25 `predictions.csv` 與 Dynamic 影片。
1. 將 TED `patient072` 的完整本次匯出放入 `private-source/ted-case/`；解析度、時間與功能輸出驗證範圍見 [TED 病例說明](docs/ted-case.md)。
1. 將已選 EchoXFlow 和 LVH 本次匯出置於 `private-source/echoxflow-screening/`，目錄對照見 [病例庫說明](docs/case-library.md)。
1. 在本網站執行 `pnpm prepare:demo`，轉換 MP4、生成封面、影片縮圖及六個病例資料。
1. 執行 `pnpm prepare:experience`，同步展台中的病例資料和實際證據幀。

`public/demo/` 是已授權的可公開示範素材；`private-source/` 與包含病例素材的 `dist/` 仍保留在本地並排除 Git 提交。預覽截圖存於 `private-source/previews/`。

## GitHub Pages 發布

公開演示網址：[iHeart](https://iheart-3decho.github.io/)。六個病例已獲使用者確認可公開展示。

`.github/workflows/pages.yml` 在 `main` 推送後驗證病例資料、檢查 TypeScript 並構建 Vue 網站，再將 `dist/` 作為 GitHub Pages artifact 發布。也可透過 GitHub Actions 的手動執行入口重新發布。Pages 的發布來源使用 **GitHub Actions**，不直接發布倉庫根目錄。

發布內容包括前端與 `public/demo/` 中的 MP4、縮圖及預置結果。`private-source/`、原始研究 AVI 和本地驗收截圖不進入發布 artifact。

部署後可驗證公開網站：

```bash
DEMO_URL=https://iheart-3decho.github.io/ pnpm check:browser
```
