# STG 展台部署

## 服務與路徑

2026-10-23 更新為[臨床分析工作站](clinical-workstation.md)，包含流程動效與同頁量測報告；原展台保留在 `#/experience`。沿用六病例、七項指標及八段輪播，預設展示 EchoXFlow `recording_f253dc88013d7a95` 四腔心影片。選片與實際輸出見 [病例庫說明](case-library.md)。

- SSH：`ssh smarthealth@158.132.74.7 -p 12312`。
- 網址：[iHeart STG 展台](http://158.132.74.7:8080/)。伺服器本機瀏覽器使用 `http://127.0.0.1:8080/`，網路斷開時仍可操作本機素材。
- 部署目錄：`/home/smarthealth/demos/crf-demo/lyh/`；靜態檔案在 `site/`，Caddy 執行檔在 `bin/caddy`，設定檔在 `Caddyfile`。
- Ubuntu 22.04、X11 桌面、Firefox kiosk；HDMI-2／HDMI-3 均以 1920 × 1080 鏡像顯示。
- Caddy 2.11.7 使用官方 Linux amd64 發行檔，已核對官方 SHA-512。使用一般帳號的 8080 埠，未修改其他 demo。
- Firefox 使用獨立 `browser-profile/`，不修改使用者原瀏覽器資料。`gnome-session-inhibit` 僅在展示瀏覽器運行期間阻止桌面閒置。

`iheart-caddy.service` 保持啟用，隨使用者服務啟動，負責背景網頁服務。`iheart-kiosk.service` 僅供手動啟動，沒有登入啟動連結或 `[Install]`，且設為 `Restart=no`。不隨登入開窗、不在關閉或異常退出後重開；沒有修改系統登入政策。服務來源位於 [deployment/stg](../deployment/stg/)。

桌面雙擊 **iHeart Clinical Workstation**（`~/Desktop/iheart-clinical.desktop`）全螢幕開啟；**Alt+F4 關閉**。再次點擊可重新開啟；已開啟時不重複建立視窗。原 `iheart-crf-v3.desktop` 屬另一個演示，保持不變。

Ubuntu Snap 會將 Firefox 移到獨立 scope。`deployment/stg/kiosk.py` 只管理此 demo 的獨立 profile；視窗退出後正常結束，不重啟。停止服務時僅關閉此 profile；`gnome-session-inhibit` 僅在此視窗運行時生效。

## 更新

在網站專案執行：

```bash
pnpm lint
pnpm check:data
pnpm build
rsync -av --exclude=/demo-private/ -e 'ssh -p 12312' dist/ \
  smarthealth@158.132.74.7:/home/smarthealth/demos/crf-demo/lyh/site/
```

上傳靜態檔案不自動打開瀏覽器。需要展示時點桌面快捷方式，或手動執行（SSH 主機上）：

```bash
systemctl --user start iheart-kiosk.service
systemctl --user status iheart-caddy.service iheart-kiosk.service
```

只有修改 Caddyfile 時，才執行 `systemctl --user restart iheart-caddy.service`。只更新靜態檔案不需要重啟 Caddy。首頁與 JSON 使用 `Cache-Control: no-cache`，可避免舊病例資料殘留。

若更新 kiosk 管理檔，先 `systemctl --user disable --now iheart-kiosk.service`，再將 `deployment/stg/kiosk.py` 複製至部署目錄的 `kiosk.py`，service 複製至 `~/.config/systemd/user/iheart-kiosk.service`，執行 `systemctl --user daemon-reload`。不要 enable 此瀏覽器服務。將 `deployment/stg/iheart-clinical.desktop` 複製至桌面並賦予執行權限及 `metadata::trusted=true`；需要展示時才手動啟動。

`public/demo-private/` 是未使用的早期本地素材，不作為本次網站入口；上傳時排除。伺服器首次傳輸產生的副本已移至 web root 之外的 `legacy-demo-private/` 保留，沒有刪除研究材料。

## 2026-10-23 工作站與手動啟動驗證

- 本地 lint、資料檢查、TypeScript 與構建通過；遠端站點與本地 `dist/` 以 rsync checksum dry-run 核對一致，排除早期 `demo-private/`。
- 對實際部署網址執行 `pnpm check:clinical-motion` 通過：原生時間動效、同頁報告、過渡中切換病例、減少動效及單屏排版均正常。
- 透過桌面快捷方式實際啟動 Firefox，確認為新版工作站；影片已解碼且無媒體錯誤，同頁報告可見。實際屏幕、viewport 及頁面尺寸均為 1920 × 1080，全螢幕且無面板溢出，已查看截圖。
- 兩次手動啟動／正常關閉測試通過；關閉後保持 `inactive/dead`、`Result=success`、`NRestarts=0`，沒有殘留此 demo 的 Firefox 或 launcher。瀏覽器服務為 `static`、`Restart=no`，登入啟動連結已移除；Caddy 維持 active。
- 舊站點與啟動設定備份：`/home/smarthealth/demos/crf-demo/lyh/backups/20261023-manual/`。實際屏幕截圖與尺寸記錄：遠端 `validation/20261023-clinical/`，本地 `private-source/clinical-validation/remote-20261023/`。部署結束保持視窗關閉，等待使用者點桌面快捷方式。

## 2026-10-16 舊展台部署驗證（歷史記錄）

- 外部訪問 HTTP 200，預設為 EchoXFlow `recording_f253dc88013d7a95`，EF 59.1004%、EDV 100.9506 mL、ESV 41.2884 mL。
- 部署網址的 `pnpm check:library` 通過全部八段輪播與完整循環、六病例互動及結果、任務期間病例固定與單屏排版。本地 `pnpm check:browser` 亦通過原有六入口、自動演示、鍵盤及減少動效檢查。
- 在實際連接屏幕的 Firefox 完成新 A4C 泵血選幀、揭示結果、PLAX 尺寸選幀與畫線、結果對照、返回待機；影片自動交替播放，沒有媒體錯誤。
- 實際全屏 viewport、桌面及頁面 scroll dimensions 均為 1920 × 1080；已逐張檢視待機、PLAX 待機、泵血結果及尺寸結果截圖。
- 瀏覽器目前保留待機首頁。兩個 service 均為 active／enabled。

更新前的站點備份位於 `/home/smarthealth/demos/crf-demo/lyh/site-before-20261016.tgz`，沒有修改其他 demo 的檔案或關閉其他演示程式。實際屏幕曾被另一個演示視窗蓋住，已將心超 Firefox 切回前台後重新截圖核對。

遠端截圖與機器可讀報告：`/home/smarthealth/demos/crf-demo/lyh/validation/20261016-library/`；本地副本：`private-source/case-library-validation/remote/`。驗證使用只監聽 localhost 的 Firefox Marionette 介面；該埠沒有公開。

此為部署與功能檢查，不代替新病例的 8 小時連續運行驗收。

## 同步 GitHub Pages

2026-10-16 已將同一網站版本發布至 [GitHub Pages](https://iheart-3decho.github.io/)。功能與素材提交為 `b4181d8`，[構建與部署流程](https://github.com/iheart-3Decho/iheart-3decho.github.io/actions/runs/38874143155) 成功。

- 線上首頁、病例 JSON、逐病例預測、互動資料及兩段 EchoXFlow MP4 的 SHA-256 均與本地構建相同。
- 對 GitHub Pages 實際網址執行 `pnpm check:library` 與 `pnpm check:browser`，八段待機輪播、六病例互動、原六入口、鍵盤操作、減少動效及單屏布局全部通過。
- 輪播測試先暫停虛擬時鐘，再逐段推進；下載線上素材的實際耗時不會令測試跳過預期段落。
- STG 靜態檔案以 rsync checksum dry-run 核對，與本地構建一致；未使用的 `demo-private/` 保持排除。GitHub CI 使用已提交素材構建，不包含本地私有來源。
- STG 重啟後的 Firefox PID 已更換；監督服務維持 active，沒有自動重啟。最終實際屏幕為心超待機首頁，Firefox 處於前台及全屏。
