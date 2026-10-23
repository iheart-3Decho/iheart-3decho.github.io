# iHeart 三項研究演示展示頁

## 發布與保留範圍

GitHub Pages 的預設首頁展示三項研究：三維心臟視覺化、解剖引導二尖瓣分割、心超影片量測。首頁使用真實圖片與影片；點擊卡片在同頁查看素材，不將錄製影片當作可操作的三維模型。

使用獨立的 Vite `gallery` 模式構建公開展示。普通 `pnpm build` 的預設首頁仍是原臨床工作站；本次不連接或更新 STG 演示機。

| 入口                     | 展示版構建           | 普通構建             |
| ------------------------ | -------------------- | -------------------- |
| `#/`                     | 三項研究演示         | 臨床工作站           |
| `#/gallery`              | 三項研究演示         | 三項研究演示         |
| `#/clinical`             | 原臨床工作站         | 原臨床工作站         |
| `#/experience`           | 原互動展台           | 原互動展台           |
| `#/showcase`、`#/case/…` | 原六項入口及病例詳情 | 原六項入口及病例詳情 |

## 操作

- 首頁以使用者提供的三項目完整介紹影片為主視覺，以末段功能量測畫面作封面，避免載入時從空白片頭開始；提供原生播放、音量、進度及全螢幕控制，點擊後手動播放，不重複循環。三項研究的圖片與短片為下方補充入口。
- 三張卡片分別開啟實際素材。上方按鈕切換影片、介面截圖和方法圖；影片提供原生播放、音量、進度及全螢幕控制。
- 「觀看介紹影片」開啟約 3 分 23 秒的完整介紹，需手動播放，不自動開啟聲音。
- 按 Escape 或關閉按鈕返回；焦點回到原入口。開啟素材時暫停首頁影片，關閉後只在原先播放中的情況下恢復。
- 「從影片到心臟量測」另有「開啟互動工作站」，可進入保留的臨床分析 demo。

## 素材來源與處理

2026-10-23 經使用者指定，以 macOS Mail 的 AppleScript 介面保存「InnoCarnival 2026 - Website Material」郵件附件；素材保存使用 osascript 完成。完整介紹影片使用使用者提供的 Downloads 副本。郵件正文、簽名及內部方法提示文字不公開。

原始附件保留於本地 `private-source/innocarnival-20261023/`，不提交 Git；公開衍生素材位於 `public/exhibition/`。

| 公開素材                                     | 來源及處理                                                                                                           |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `iheart-overview.mp4`                        | 使用者提供的 `cdd0e0bc968d7e9097b7992ba5a6594f.mp4`，原樣複製；960 × 544，202.858 秒，保留音訊                       |
| `heart-clipping.mp4`                         | 附件 `tee_cavity_comparison_1080p.mp4`，原樣複製；1920 × 1080，18 秒                                                 |
| `gaussian-evolution.mp4`                     | 附件 `gaussian_training_evolution_1080p.mp4`，原樣複製；1920 × 1080，6 秒                                            |
| `video-analysis.mp4`                         | 完整介紹影片的 137–183 秒段落；H.264，保留畫面順序及速度，移除音訊                                                   |
| `visualization.jpg`                          | 附件 `3d visualization-300dpi.png`，轉 JPEG，不裁切內容                                                              |
| `leaflets-case-1.jpg`、`leaflets-case-2.jpg` | 附件 `result1.png`、`result2.png`，轉 JPEG，不裁切內容                                                               |
| `segmentation-method.jpg`                    | 附件 `3d segmentation.jpg`，限制最長橫向尺寸為 1920 像素                                                             |
| `analysis-method.jpg`                        | 附件 `Echocardiography_Model_Function_300dpi.png`，等比例縮至寬 1920 像素                                            |
| `clinical-workstation.jpg`                   | 現有工作站實際截圖 `private-source/clinical-validation/remote-nine-cases/01-fullscreen-clinical-report.png`，轉 JPEG |
| `clipping-poster.jpg`                        | 切面影片的第 8 秒畫面                                                                                                |
| `overview-poster.jpg`                        | 完整介紹的第 160 秒畫面                                                                                              |

三份原樣複製影片的 SHA-256：

```text
iheart-overview.mp4   d03aff74966b1063c647f67eaee90631e6676434318404bfe861e24d62d0ea88
heart-clipping.mp4   5f5d0cdd12b520421928578740b4e2f904ae7dfa6afdc8ea61fda2d9667a0cee
gaussian-evolution.mp4   90daba9611ea7b40c747ab49df8bcea028089f6834fef47a7e9535030bd30392
```

展示頁不新增精度、臨床療效或即時推理主張；不同模型示例不合併成同一患者的完整輸出。既有工作站仍使用自己的原始資料和預測。

## 本地構建與檢查

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm check:types
pnpm check:data
pnpm build:gallery
pnpm preview:gallery
```

展示頁預覽為 `http://127.0.0.1:4174/`。在另一個終端執行 `pnpm check:gallery`，以無頭 Chrome 驗證三項演示的九份素材、完整介紹、播放／暫停、媒體重試、鍵盤與焦點恢復、減少動效、桌面及手機版面，以及所有保留入口。截圖和檢查報告保留於本地 `private-source/exhibition-validation/`。

普通構建仍使用 `pnpm build`、`pnpm preview`，預覽為 `http://127.0.0.1:4173/`；以 `pnpm check:clinical` 和 `pnpm check:browser` 回歸工作站及舊六入口。

GitHub Actions 在 `main` 更新後執行資料檢查、lint 和 `pnpm build:gallery`，僅將 `dist-gallery/` 發布到 Pages。此流程不連接演示機，不變更其 Caddy、桌面快捷方式或服務。
