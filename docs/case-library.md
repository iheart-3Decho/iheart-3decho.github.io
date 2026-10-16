# 展台病例庫與逐項輪播

## 病例與入口

2026-10-15 將兩個原本使用 112 × 112 EchoNet-Dynamic 影片的入口，換成 EchoXFlow 四腔心影片。保留六個既有病例路由；待機首頁依七項指標輪播，可手動上一段、下一段或暫停。

| 病例路由       | 資料來源                               | 影片                             | 待機展示    |
| -------------- | -------------------------------------- | -------------------------------- | ----------- |
| `function`     | TED `patient072`                       | 472 × 388，51 幀                 | EF          |
| `function-27`  | EchoXFlow `recording_6dba5e90149f5b09` | 946 × 736，105 幀，48.933255 fps | EDV         |
| `function-61`  | EchoXFlow `recording_f253dc88013d7a95` | 790 × 736，118 幀，59.697928 fps | EF、ESV     |
| `dimension`    | EchoNet-LVH `0X100EC1C77A847AA7`       | 1024 × 768，225 幀，65 fps       | LVIDd       |
| `dimension-02` | EchoNet-LVH `0X1278336999990DD9`       | 1024 × 768，241 幀，50 fps       | IVSd、LVPWd |
| `dimension-03` | EchoNet-LVH `0X174E6302A0DA1AD0`       | 1024 × 768，115 幀，50 fps       | LVIDs       |

每個功能病例仍包含自己的 EF、EDV、ESV、ED／ES 定位與輪廓；每個尺寸病例仍包含自己的四項尺寸。不同入口的數值不拼成同一患者。待機共八段、七項指標，依次展示 EchoXFlow EF → LVIDd → EDV → IVSd → ESV → LVIDs → LVPWd → TED EF，再循環。每段 12 秒：播放影片 8 秒，再顯示對應量測畫面 4 秒。打開網站先看新選的 EchoXFlow `recording_f253dc88013d7a95`，EF 為 59.1%；原 TED 病例仍可從既有 EF 入口查看。

「開始體驗」沿用當時展示的病例，尺寸任務也沿用當時的指標。進入任務後停止輪播，直到結束才返回待機；修改、重畫與「再試一次」維持同一病例。觀眾明確切換尺寸指標時也維持本輪影片。

## 推理及影像核對

所有病例使用同一 model25 checkpoint，SHA-256：`8322f7bd1a216bd40bc028a709726d90d1dd528ea4102831c872846a5f6c243f`。未換權重、擬合病例、改寫數值或用醫生輪廓替代預測。

EchoXFlow 先查看前四次檢查的 48 段二維灰階影片，再對有正式 4CH 關聯標籤的三段候選和一段目視長軸候選運行推理。採用上表的兩段四腔心影片：逐一查看 ED、ES 的實際單幀分割，確認輪廓位於左心室、充盈與收縮可區分、未超出畫面。另兩段未納入：長軸候選的切面與測量線不適合此項展示，第三段四腔心的心腔可辨識度較低。這是展示素材的工程／目視篩選，沒有新的醫生標註或準確率評估。

EchoNet-LVH 的第二、三個病例也以同一權重重新匯出，逐一查看全部四項量測線；網站同步此次實際輸出，不混用舊 CSV 的聚合端點。最終毫米值保留模型的時間證據聚合結果；畫線則使用該證據幀自己的預測端點。第一個 LVH 病例沿用既有逐幀匯出，並同步到原詳情頁。

EchoXFlow 使用官方 `sector_to_cartesian` 按探頭幾何作線性插值，未降噪、銳化、調整對比或生成式超分。來源為 `[時間, 深度, 掃描線]` 陣列：兩段分別為 105 × 735 × 242、118 × 735 × 198；顯示像素網格不是原生橫向掃描線數。H.264 只在需要時於右／下方補一像素黑邊，完整保留來源幀及相對時間戳。

新片各保留兩個完整 QRS–QRS 間期。實際幀率來自來源時間戳；不能使用容器名義上四捨五入的 49／60 fps 定位。資料檢查逐幀核對 MP4 時間與網站定位基準，容許偏差小於 0.05 幀。

EchoXFlow 功能分支屬跨資料集推理，沒有該病例的 EF／絕對容積金標準，故不報告新準確率，也不更動論文結果。各病例展示值均為實際模型輸出。

## 資料來源與重建

- [EchoXFlow：Ahus-AIM](https://huggingface.co/datasets/Ahus-AIM/EchoXFlow)，[官方幾何還原工具](https://github.com/Ahus-AIM/EchoXFlow)，[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)。網站的「影像來源」入口保留作者、連結、授權與加工說明。使用者已確認本次公開展示授權。
- EchoXFlow 原始資料位於研究伺服器 `datasets/raw_data/echoxflow/exams/`。推理匯出位於 `output/demo_exports/20261015_echoxflow/`，以論文目錄既有 `ct-heart-remote` 腳本傳輸。
- 本地候選影像、原始張量及檢查拼圖保存在 `private-source/echoxflow-screening/`，不進入 Git／部署。
- `scripts/prepare-case-library.mjs` 按固定匯出目錄重建已選病例及播放清單。先準備原病例基底，再套用本次選片；`pnpm prepare:demo` 和 `pnpm prepare:experience` 已串接此步。
- `public/demo/library-predictions.json` 保存來源 ID、原始推理值、證據幀、幾何、座標轉換及素材 SHA-256；`public/experience/experience.json` 的 `library` 與 `playlist` 驅動展台。CI 不需要私有張量即可核對已發布素材。

## 驗證

`pnpm check:library` 逐一檢查八段待機示範（涵蓋七項指標）、完整循環回到首項、六個病例的互動與對照、任務開始後病例固定、揭示前不顯示答案，以及 1920 × 1080 單屏布局。輪播計時以瀏覽器受控時間加速，並非長時間待機驗收。

另執行 `pnpm check:data`、`pnpm check:browser`、`pnpm check:experience`、`pnpm check:types`、`pnpm lint`、`pnpm build`。此次 100 次互動／復位通過；先前的八小時報告不作為本次病例庫版本的連續八小時驗收。

截圖和報告保存在 `private-source/case-library-validation/`、`private-source/booth-validation/` 及 `private-source/previews/`，逐頁目視檢查；影片完整顯示於量測說明區上方，避免說明卡遮住心室。
