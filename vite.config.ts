import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'node:https'

// https://vite.dev/config/
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
