# STG 展台部署

## 服務與路徑

2026-10-16 更新為六病例、七項指標、八段待機輪播，預設展示 EchoXFlow `recording_f253dc88013d7a95` 四腔心影片。TED 與三個 PLAX 病例仍保留，選片與實際輸出見 [病例庫說明](case-library.md)。

- SSH：`ssh smarthealth@158.132.74.7 -p 12312`。
- 網址：[iHeart STG 展台](http://158.132.74.7:8080/)。伺服器本機瀏覽器使用 `http://127.0.0.1:8080/`，網路斷開時仍可操作本機素材。
- 部署目錄：`/home/smarthealth/demos/crf-demo/lyh/`；靜態檔案在 `site/`，Caddy 執行檔在 `bin/caddy`，設定檔在 `Caddyfile`。
- Ubuntu 22.04、X11 桌面、Firefox kiosk；HDMI-2／HDMI-3 均以 1920 × 1080 鏡像顯示。
- Caddy 2.11.7 使用官方 Linux amd64 發行檔，已核對官方 SHA-512。使用一般帳號的 8080 埠，未修改其他 demo。
- Firefox 使用獨立 `browser-profile/`，不修改使用者原瀏覽器資料。`gnome-session-inhibit` 僅在展示瀏覽器運行期間阻止桌面閒置。

兩個 systemd user service 已啟用：`iheart-caddy.service` 隨使用者服務啟動，`iheart-kiosk.service` 隨圖形桌面登入啟動。沒有設定免登入或修改系統登入政策；重開機後仍需進入 smarthealth 桌面。服務來源位於 [deployment/stg](../deployment/stg/)。

Ubuntu Snap 會將 Firefox 移到獨立 scope，單靠原本的 service 重啟可能留下舊瀏覽器。`deployment/stg/kiosk.py` 持續監督此 demo 的獨立 profile，停止服務時僅關閉此 profile，讓重啟確實重新開啟展示瀏覽器；`gnome-session-inhibit` 亦持續生效。

## 更新

在網站專案執行：

```bash
pnpm lint
pnpm check:data
pnpm build
rsync -av --exclude=/demo-private/ -e 'ssh -p 12312' dist/ \
  smarthealth@158.132.74.7:/home/smarthealth/demos/crf-demo/lyh/site/
```

透過 SSH 重開展示瀏覽器，讓其載入新構建：

```bash
systemctl --user restart iheart-kiosk.service
systemctl --user status iheart-caddy.service iheart-kiosk.service
```

只有修改 Caddyfile 時，才執行 `systemctl --user restart iheart-caddy.service`。只更新靜態檔案不需要重啟 Caddy。首頁與 JSON 使用 `Cache-Control: no-cache`，可避免舊病例資料殘留。

若更新 kiosk 管理檔，先將 `deployment/stg/kiosk.py` 複製至部署目錄的 `kiosk.py`，service 複製至 `~/.config/systemd/user/iheart-kiosk.service`，執行 `systemctl --user daemon-reload` 後再重啟服務。

`public/demo-private/` 是未使用的早期本地素材，不作為本次網站入口；上傳時排除。伺服器首次傳輸產生的副本已移至 web root 之外的 `legacy-demo-private/` 保留，沒有刪除研究材料。

## 本次驗證

- 外部訪問 HTTP 200，預設為 EchoXFlow `recording_f253dc88013d7a95`，EF 59.1004%、EDV 100.9506 mL、ESV 41.2884 mL。
- 部署網址的 `pnpm check:library` 通過全部八段輪播與完整循環、六病例互動及結果、任務期間病例固定與單屏排版。本地 `pnpm check:browser` 亦通過原有六入口、自動演示、鍵盤及減少動效檢查。
- 在實際連接屏幕的 Firefox 完成新 A4C 泵血選幀、揭示結果、PLAX 尺寸選幀與畫線、結果對照、返回待機；影片自動交替播放，沒有媒體錯誤。
- 實際全屏 viewport、桌面及頁面 scroll dimensions 均為 1920 × 1080；已逐張檢視待機、PLAX 待機、泵血結果及尺寸結果截圖。
- 瀏覽器目前保留待機首頁。兩個 service 均為 active／enabled。

更新前的站點備份位於 `/home/smarthealth/demos/crf-demo/lyh/site-before-20261016.tgz`，沒有修改其他 demo 的檔案或關閉其他演示程式。實際屏幕曾被另一個演示視窗蓋住，已將心超 Firefox 切回前台後重新截圖核對。

遠端截圖與機器可讀報告：`/home/smarthealth/demos/crf-demo/lyh/validation/20261016-library/`；本地副本：`private-source/case-library-validation/remote/`。驗證使用只監聽 localhost 的 Firefox Marionette 介面；該埠沒有公開。

此為部署與功能檢查，不代替新病例的 8 小時連續運行驗收。
