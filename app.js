import express from 'express'
import swaggerUi from 'swagger-ui-express'
import { readFileSync } from 'fs'
import path from 'path'
import { rateLimit } from 'express-rate-limit'
import * as OpenApiValidator from 'express-openapi-validator'
import mongoose from 'mongoose'

import Password from './src/models/Password.js'
import User from './src/models/User.js'
import { createToken } from './src/helpers/token.js'
import authenticate from './src/middlewares/authenticate.js'
import { ApiError } from './src/helpers/Errors.js'

const swaggerDocument = JSON.parse(
  readFileSync(path.resolve('./src/docs/swagger.json'))
)

const getAppVersion = () => process.env.APP_VERSION || 'unknown'

const app = express()

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(
  OpenApiValidator.middleware({
    apiSpec: './src/docs/swagger.json',
    validateRequests: true,
    validateResponses: true
  })
)

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
  throw new ApiError(500, 'Internal Server Error')
})

app.get('/ping', (_req, res) => {
  res.send({ version: getAppVersion() })
})

app.get('/users', apiLimiter, authenticate, async (_req, res, next) => {
  try {
    const users = await User.find().lean().exec()
    res.send({ users })
  } catch (err) {
    next(err)
  }
})

app.get('/users/:id', apiLimiter, authenticate, async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) }).lean().exec()
    if (!user) {
      throw new ApiError(404, 'User not found')
    }
    res.send({ user })
  } catch (err) {
    next(err)
  }
})

app.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { username: email, password } = req.body

    if (!email || !password) {
      throw new ApiError(422, 'User y password son requeridos')
    }

    const user = await User.findOne({ email }, { _id: 1 })
    if (!user) {
      throw new ApiError(401, 'Usuario y/o password incorrectos')
    }

    const credential = await Password.findOne({ user: user._id })
    if (!credential) {
      throw new ApiError(401, 'Usuario y/o password incorrectos')
    }

    const esValida = await credential.comparePassword(password)
    if (!esValida) {
      throw new ApiError(401, 'Usuario y/o password incorrectos')
    }

    res.send({ token: createToken(user) })
  } catch (err) {
    next(err)
  }
})

app.use((err, req, res, next) => {
  res.status(err.status || err.statusCode || 500).send({
    message: err.message,
    error: process.env.NODE_ENV === 'production' ? {} : err
  })
})

export default app
