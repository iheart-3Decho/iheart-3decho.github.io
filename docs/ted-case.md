# TED 高解析度泵血示範病例

2026-10-15 更新 `function` 入口及展台泵血任務。其餘五個病例保留。網站資料與全部影像均來自新病例，未沿用舊病例的 EF 或容積。

## 來源與推理

- 資料集：[TED 官方說明](https://humanheart-project.creatis.insa-lyon.fr/ted.html)，完整心動週期 A4C。
- 病例：`patient072`，既有 model25 manifest 的 test split。在固定 11 個官方 Good 畫質留出病例中，比較同一 checkpoint 的 EF、定位與輪廓後選為展示個案；沒有訓練或調整模型。個案選取不代表整個測試集的準確率。
- 遠端影像：`/data2/liyunhao/code/CT-TEE/datasets/raw_data/ted/TED/database/patient072/patient072_4CH_sequence.mhd` 及同名 `.raw`。
- 遠端本次輸出：`/data2/liyunhao/code/CT-TEE/output/demo_exports/20261015_ted/patient072-isotropic/`；完整候選比較保存在同層 `screening/`。
- 本地輸出：`private-source/ted-case/`，含 `prediction.json`、`function_raw_outputs.npz`、MP4 及證據幀圖片；原始張量不納入 Git。
- 模型：既有 `s3_echo_model25_periodic_state/selected.ckpt`，SHA-256 `8322f7bd1a216bd40bc028a709726d90d1dd528ea4102831c872846a5f6c243f`，與 PLAX 展示相同。
- 使用專案 `.scripts/ct-heart-remote/` 腳本連線。重現程式為 `scripts/export-ted-case.py`，於遠端專案根目錄使用既有 `.venv` 執行。

原圖為 472 × 778，像素間距 0.308 × 0.154 mm。恢復物理比例後為 472 × 388，按模型既有 resize/pad 輸入；不使用生成式超分、不裁掉心動週期。51 幀保留原序。TED 無已核實的採集 FPS，30 fps 為展示速度；介面統一顯示週期位置，不推導生理心率。

模型共享編碼與 periodic state 使用同一份輸入。呼叫未修改的 function head，同時取得 ED／ES 權重、逐幀機率圖、容積軌跡及最終 EF／EDV／ESV。推理前校正像素比例，因此不同於論文原生非等距 TED 分割評估的預處理；未修改任何論文表格或基準。

## 原始輸出與顯示

| 項目    | 原始模型輸出         | 網頁顯示 |
| ------- | -------------------- | -------- |
| EF      | 55.19455075263977%   | 55.2%    |
| EDV     | 148.3174592256546 mL | 148.3 mL |
| ESV     | 66.45430326461792 mL | 66.5 mL  |
| ED 證據 | 零起始第 0 幀        | 週期 0%  |
| ES 證據 | 零起始第 19 幀       | 週期 38% |

EF 與 `(EDV − ESV) / EDV × 100` 一致。最終數值使用功能分支的時間證據聚合結果；圖片輪廓取定位幀的實際單幀機率圖，沒有把聚合輪廓貼到單幀。

來源參考 EF 為 54%，模型預測 55.1946%，相差 1.1946 個百分點。ED／ES 定位與來源參考幀均一致。還原至原始尺寸後，同一證據幀上的輪廓 Dice 分別為 0.9637／0.8965。功能分支原在 EchoNet-Dynamic 學習絕對容積比例，TED 的既有正式評估是分割；本例沒有可核對的 EDV／ESV 參考值，不能以 EF 接近推定絕對容積準確。網站呈現模型原始結果與量測原理，不為該病例判定健康或疾病。

舊 `patient025` 本地原始匯出保存在 `private-source/ted-case-patient025/`，候選比較及兩個候選完整匯出保存在 `private-source/ted-screening/`。選取病例沒有修改論文數值或其他五個網站病例。

`public/demo/ted-prediction.json` 保存公開素材的來源摘要、SHA-256、模型輸出與坐標契約。CI 不依賴本地私有原始張量。

## 前次 patient025 版本驗證

2026-10-15 已通過 `pnpm lint`、`pnpm check:types`、`pnpm check:data`、`pnpm build`、`pnpm check:browser` 與 `pnpm check:experience`。

- 影片 39 幀、788 × 648、1:1 顯示像素、素材 SHA-256、同一 checkpoint、EF 算式及輪廓坐標核對通過。
- 瀏覽器選取的第 1、20 幀截圖與 ffmpeg 同幀解碼比對通過。
- 泵血及四項尺寸、返回修改、重畫、媒體載入失敗重試、鍵盤、閒置／取消／自動復位、只使用本地資源及原六入口回歸通過。
- 100 次完整互動／復位無瀏覽器錯誤。GC 後 heap 3,757,648 → 4,456,572 bytes，DOM 245 → 290，監聽器 34 → 34。
- 1920 × 1080 截圖檢視：對照頁與六入口頁未見溢出、遮擋或滾動條。待機影片增加來源封面，避免解碼前的短暫空白。

上述 patient025 報告及逐頁截圖保存在 `private-source/ted-validation/`。此前 8 小時待機紀錄屬舊病例版本，不視為新影片的 8 小時驗收。

## 現用 patient072 版本驗證

2026-10-15 通過 `pnpm lint`、`pnpm check:data`、`pnpm build`（包含 TypeScript 檢查）、`pnpm check:browser` 及 `pnpm check:experience`。六入口回歸亦在部署後的 Caddy 網址通過。

- 影片保留全部 51 幀，472 × 388、1:1 顯示像素；素材 SHA-256、證據幀、坐標、EF 算式與匯出數值核對通過。其餘五個病例與 PLAX 互動資料逐項比較未變。
- 瀏覽器擷取第 0、25 幀與 ffmpeg 同幀解碼比對通過。泵血與四項尺寸、返回修改、重畫、失敗重試、鍵盤、閒置復位及本地素材檢查通過。
- 100 次完整互動／復位無瀏覽器錯誤。GC 後 heap 3,760,804 → 4,458,656 bytes，DOM 246 → 305，監聽器 34 → 34。
- 已檢視本地及伺服器實屏首頁、泵血結果、尺寸結果截圖。伺服器 Firefox 全屏 viewport 與頁面尺寸均為 1920 × 1080，沒有滾動或遮擋；兩部影片均實際自動播放。詳見 [STG 部署說明](stg-deployment.md)。

本地驗收資料：`private-source/ted072-validation/`，實屏截圖與報告位於其 `remote/`。本次未重新進行 8 小時待機驗收，也未更新 GitHub Pages；新病例已部署到指定 STG 伺服器。
