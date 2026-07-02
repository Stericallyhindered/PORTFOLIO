import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const chatPort = env.CHAT_API_PORT || '3001'
  const apiTarget =
    env.CHAT_API_ORIGIN || `http://localhost:${chatPort}`

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('error', (err, _req, res) => {
              // When chat-api is down, Vite otherwise returns 500 with an empty body.
              if (res && typeof (res as NodeJS.ServerResponse).writeHead === 'function') {
                const r = res as NodeJS.ServerResponse
                if (!r.headersSent) {
                  r.writeHead(502, { 'Content-Type': 'application/json' })
                  r.end(
                    JSON.stringify({
                      error: `Cannot reach chat API at ${apiTarget}. Run: npm run dev (starts Vite + chat-api). Or set CHAT_API_ORIGIN if the API runs elsewhere. ${err.message}`,
                    })
                  )
                }
              }
            })
          },
        },
      },
    },
  }
})
