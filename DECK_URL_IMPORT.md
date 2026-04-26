# ガチまとめURLからデッキをインポートする実装メモ

## 概要

`https://gachi-matome.com/deckrecipe-detail-dm/?tcgrevo_deck_maker_deck_id=...` のURLから
デッキの40枚分カード名・文明・テキスト等を取得する。

---

## 使用するAPI（逆エンジニアリングで発見）

### 1. デッキデータ取得（Firestore REST API）

```
GET https://firestore.googleapis.com/v1/projects/prod-deckmaker-8345f/databases/(default)/documents/version/2/dm_decks/{deck_id}?key=AIzaSyCKhH2S_r29U5olfQC6AsXaaHNhqmJMR40
```

レスポンスの `fields.main_cards.arrayValue.values` に各カードの `main_card_id`（整数）が入っている。

### 2. カード詳細取得

```
GET https://d23r8jlqp3e2gc.cloudfront.net/api/v1/dm/cards/{card_id}
```

レスポンス例：
```json
{
  "main_card_id": 30818,
  "name": "異端流し オニカマス",
  "name_ruby": "イタンナガシ オニカマス",
  "cost": 2,
  "power": "2000",
  "card_text": "■相手が...",
  "is_light": false,
  "is_water": true,
  "is_dark": false,
  "is_fire": false,
  "is_nature": false,
  "is_zero": false,
  "races": [{ "race_id": 1304, "name": "ムートピア" }],
  "sub_types": [{ "sub_type_id": 1, "name": "クリーチャー" }]
}
```

---

## CORSの回避（ブラウザから直接呼べない）

カードAPIはブラウザから呼ぶとCORSエラー＋ECONNRESETが発生する。
Viteのカスタムミドルウェアでサーバーサイドプロキシを作る。

**Viteの組み込みproxyは使わない**（ECONNRESETを502として返してしまうため）。
代わりに `configureServer` フックで Node.js の `https` モジュールを使って手動プロキシを実装する。

### vite.config.ts

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'node:https'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'dm-card-proxy',
      configureServer(server) {
        // カードAPI: /proxy/dm-cards/{id} → CloudFront
        server.middlewares.use('/proxy/dm-cards', (req, res) => {
          const cardId = req.url?.replace(/^\//, '') ?? ''
          const chunks: Buffer[] = []
          let sent = false
          function send(status: number) {
            if (sent) return
            sent = true
            const body = Buffer.concat(chunks)
            if (body.length > 0) {
              res.writeHead(status, { 'Content-Type': 'application/json' })
              res.end(body)
            } else {
              res.writeHead(502); res.end('proxy error')
            }
          }
          const proxyReq = https.request({
            hostname: 'd23r8jlqp3e2gc.cloudfront.net',
            path: `/api/v1/dm/cards/${cardId}`,
            method: 'GET',
            rejectUnauthorized: false,
          }, (proxyRes) => {
            proxyRes.on('data', (chunk) => chunks.push(chunk))
            proxyRes.on('end', () => send(proxyRes.statusCode ?? 200))
            proxyRes.on('error', () => send(200))
            proxyRes.socket?.on('error', () => send(200))
          })
          proxyReq.on('error', () => send(502))
          proxyReq.end()
        })

        // Firestore: /proxy/firestore/... → firestore.googleapis.com
        server.middlewares.use('/proxy/firestore', (req, res) => {
          const path = req.url ?? ''
          const chunks: Buffer[] = []
          const proxyReq = https.request({
            hostname: 'firestore.googleapis.com',
            path: `/v1/projects/prod-deckmaker-8345f/databases/(default)/documents${path}`,
            method: 'GET',
            rejectUnauthorized: false,
          }, (proxyRes) => {
            proxyRes.on('data', (chunk) => chunks.push(chunk))
            proxyRes.on('end', () => {
              const body = Buffer.concat(chunks)
              res.writeHead(proxyRes.statusCode ?? 200, { 'Content-Type': 'application/json' })
              res.end(body)
            })
          })
          proxyReq.on('error', () => { res.writeHead(502); res.end('proxy error') })
          proxyReq.end()
        })
      },
    },
  ],
})
```

---

## フロントエンドのユーティリティ（src/utils/fetchDeckCards.ts）

```ts
const FIRESTORE_KEY = 'AIzaSyCKhH2S_r29U5olfQC6AsXaaHNhqmJMR40'
const FIRESTORE_BASE = '/proxy/firestore'   // Viteプロキシ経由
const CARD_API_BASE = '/proxy/dm-cards'     // Viteプロキシ経由
```

処理の流れ：
1. URLから `tcgrevo_deck_maker_deck_id` を抽出
2. Firestoreからデッキドキュメントを取得し `main_card_id` の一覧を集計
3. 各IDに対してカードAPIを**順番に**呼ぶ（並列だとECONNRESET多発）
4. 失敗したIDは最大3回リトライ（0.5秒・1秒・1.5秒間隔）

---

## はまりポイント

| 問題 | 原因 | 対処 |
|------|------|------|
| CORSエラー | ブラウザからCloudFront APIに直接アクセス不可 | Viteカスタムミドルウェアでプロキシ |
| ECONNRESET | CloudFrontがレスポンス後にTCP接続をリセットする | `socket.on('error')` も捕捉しデータがあれば返す |
| Vite組み込みproxyが502を返す | ECONNRESETをエラーとして処理してしまう | `configureServer` で手動実装 |
| 並列リクエストでECONNRESET多発 | サーバー側の同時接続制限 | `for...of` で逐次処理 |
| `cardNames.map is not a function` | `onImport(names, deckName)` の引数順を間違えた | 第1引数がデッキ名、第2引数がカード名配列 |
