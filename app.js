import express from 'express'
import swaggerUi from 'swagger-ui-express'
import { readFileSync } from 'fs'
import path from 'path'

import User from './src/models/User.js'

const swaggerDocument = JSON.parse(
  readFileSync(path.resolve('./src/docs/swagger.json'))
)

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

app.get('/users', async (_req, res) => {
  try {
    const users = await User.find().lean().exec()
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: true }))

export default app
