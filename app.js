import express from 'express'

process.loadEnvFile()

const version = process.env.APP_VERSION || 'unknown'

const app = express()

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.get('/error', (req, res) => {
  res.status(500).json({ error: 'Internal Server Error' })
})

app.get('/ping', (_req, res) => {
  res.json({ version })
})

export default app
