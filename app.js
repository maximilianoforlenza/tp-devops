import express from 'express'
import swaggerUi from 'swagger-ui-express'
import { readFileSync } from 'fs'
import path from 'path'
import { rateLimit } from 'express-rate-limit'

import Password from './src/models/Password.js'
import User from './src/models/User.js'
import { createToken } from './src/helpers/token.js'
import authenticate from './src/middlewares/authenticate.js'

const swaggerDocument = JSON.parse(
  readFileSync(path.resolve('./src/docs/swagger.json'))
)

const getAppVersion = () => process.env.APP_VERSION || 'unknown'

const app = express()

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    message: 'An error occurred',
    error: process.env.NODE_ENV === 'production' ? {} : err
  })
})

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
})

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: 'Too many login attempts. Try again in an hour.'
})

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

app.get('/users', apiLimiter, authenticate, async (_req, res) => {
  try {
    const users = await User.find().lean().exec()
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/login', authLimiter, async (req, res) => {
  try {
    const { username: email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y password son requeridos' })
    }

    const user = await User.findOne({ email }, { _id: 1 })
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

    res.send({ token: createToken(user) })
  } catch (err) {
    console.error('Error en login:', err)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
})

export default app
