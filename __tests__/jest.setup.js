import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

import User from '../src/models/User.js'
import Password from '../src/models/Password.js'

process.env.MONGOMS_VERSION = '7.0.14'
process.env.APP_VERSION = '1.0.1'
process.env.SECRET = 'secret'

let mongoServer

export async function connectTestDB () {
  mongoServer = await MongoMemoryServer.create()
  const uri = mongoServer.getUri()
  await mongoose.connect(uri)
}

export async function disconnectTestDB () {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
  await mongoServer.stop()
}

export async function clearTestDB () {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
}

export async function createUser ({ email = credentials.username, password = credentials.password, active = true } = {}) {
  const user = await User.create({
    name: 'Usuario Test',
    email,
    active
  })

  await Password.create({
    user: user._id,
    password
  })

  return user
}

export const credentials = {
  username: 'usuario@test.com',
  password: 'PasswordValida123!'
}
