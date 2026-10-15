# TED 高解析度泵血示範病例

2026-10-15 更新 `function` 入口及展台泵血任務。其餘五個病例保留。網站資料與全部影像均來自新病例，未沿用舊病例的 EF 或容積。

## 來源與推理

- 資料集：[TED 官方說明](https://humanheart-project.creatis.insa-lyon.fr/ted.html)，完整心動週期 A4C。
- 病例：`patient025`，既有 model25 manifest 的 test split；依官方 Good 畫質、原始解析度及原圖可讀性選取，未調整模型或依測試誤差選模。
- 遠端影像：`/data2/liyunhao/code/CT-TEE/datasets/raw_data/ted/TED/database/patient025/patient025_4CH_sequence.mhd` 及同名 `.raw`。
- 遠端本次輸出：`/data2/liyunhao/code/CT-TEE/output/demo_exports/20261015_ted/patient025-isotropic/`。
- 本地輸出：`private-source/ted-case/`，含 `prediction.json`、`function_raw_outputs.npz`、MP4 及證據幀圖片；原始張量不納入 Git。
- 模型：既有 `s3_echo_model25_periodic_state/selected.ckpt`，SHA-256 `8322f7bd1a216bd40bc028a709726d90d1dd528ea4102831c872846a5f6c243f`，與 PLAX 展示相同。
- 使用專案 `.scripts/ct-heart-remote/` 腳本連線。重現程式為 `scripts/export-ted-case.py`，於遠端專案根目錄使用既有 `.venv` 執行。

原圖為 787 × 1297，像素間距 0.308 × 0.154 mm。恢復物理比例後為 788 × 648，按模型既有 resize/pad 輸入；不使用生成式超分、不裁掉心動週期。39 幀保留原序。TED 無已核實的採集 FPS，30 fps 為展示速度；介面統一顯示週期位置，不推導生理心率。

模型共享編碼與 periodic state 使用同一份輸入。呼叫未修改的 function head，同時取得 ED／ES 權重、逐幀機率圖、容積軌跡及最終 EF／EDV／ESV。推理前校正像素比例，因此不同於論文原生非等距 TED 分割評估的預處理；未修改任何論文表格或基準。

## 原始輸出與顯示

| 項目    | 原始模型輸出          | 網頁顯示 |
| ------- | --------------------- | -------- |
| EF      | 40.99433422088623%    | 41.0%    |
| EDV     | 31.448690593242645 mL | 31.4 mL  |
| ESV     | 18.556509912014008 mL | 18.6 mL  |
| ED 證據 | 零起始第 1 幀         | 週期 3%  |
| ES 證據 | 零起始第 18 幀        | 週期 47% |

EF 與 `(EDV − ESV) / EDV × 100` 一致。最終數值使用功能分支的時間證據聚合結果；圖片輪廓取定位幀的實際單幀機率圖，沒有把聚合輪廓貼到單幀。

功能分支原在 EchoNet-Dynamic 學習絕對容積比例，TED 的既有正式評估是分割。本次屬跨資料集逐病例輸出，不能據此認定 TED 上的功能或絕對容積準確性。病例資料的參考 EF 為 22%，與模型 40.99% 不一致；兩者不混用，也不以參考值替代模型預測。網站只呈現模型結果與量測原理，不為該病例判定健康或疾病。

`public/demo/ted-prediction.json` 保存公開素材的來源摘要、SHA-256、模型輸出與坐標契約。CI 不依賴本地私有原始張量。

## 驗證範圍

2026-10-15 已通過 `pnpm lint`、`pnpm check:types`、`pnpm check:data`、`pnpm build`、`pnpm check:browser` 與 `pnpm check:experience`。

- 影片 39 幀、788 × 648、1:1 顯示像素、素材 SHA-256、同一 checkpoint、EF 算式及輪廓坐標核對通過。
- 瀏覽器選取的第 1、20 幀截圖與 ffmpeg 同幀解碼比對通過。
- 泵血及四項尺寸、返回修改、重畫、媒體載入失敗重試、鍵盤、閒置／取消／自動復位、只使用本地資源及原六入口回歸通過。
- 100 次完整互動／復位無瀏覽器錯誤。GC 後 heap 3,757,648 → 4,456,572 bytes，DOM 245 → 290，監聽器 34 → 34。
- 1920 × 1080 截圖檢視：對照頁與六入口頁未見溢出、遮擋或滾動條。待機影片增加來源封面，避免解碼前的短暫空白。

本次報告及逐頁截圖保存在 `private-source/ted-validation/`。此前 8 小時待機紀錄屬舊病例版本，不視為新影片的 8 小時驗收。本次保留為本地版本，尚未覆蓋線上網站；功能輸出偏差需與展示用途分開評估。
