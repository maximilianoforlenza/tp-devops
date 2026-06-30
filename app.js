import express from 'express'
import swaggerUi from 'swagger-ui-express'
import { readFileSync } from 'fs'
import path from 'path'

import Password from './src/models/Password.js'
import User from './src/models/User.js'

const swaggerDocument = JSON.parse(
  readFileSync(path.resolve('./src/docs/swagger.json'))
)

const getAppVersion = () => process.env.APP_VERSION || 'unknown'

const app = express()

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

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
  res.json({ version: getAppVersion() })
})

app.get('/users', async (_req, res) => {
  try {
    const users = await User.find().lean().exec()
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/login', async (req, res) => {
  try {
    const { username: email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y password son requeridos' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Usuario y/o password incorrectos' })
    }

    const credential = await Password.findOne({ user: user._id })
    if (!credential) {
      return res.status(401).json({ message: 'Usuario y/o password incorrectos' })
    }

    const esValida = await credential.comparePassword(password)
    if (!esValida) {
      return res.status(401).json({ message: 'Usuario y/o password incorrectos' })
    }

    return res.sendStatus(200)
  } catch (err) {
    console.error('Error en login:', err)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
})

export default app
