import request from 'supertest'

import app from '../app.js'
import User from '../src/models/User.js'
import Password from '../src/models/Password.js'
import { connectTestDB, disconnectTestDB, clearTestDB } from './jest.setup.js'

const credentials = {
  username: 'usuario@test.com',
  password: 'PasswordValida123!'
}

beforeAll(async () => {
  await connectTestDB()
})

afterAll(async () => {
  await disconnectTestDB()
})

afterEach(async () => {
  await clearTestDB()
})

async function createUser ({ email = credentials.username, password = credentials.password, active = true } = {}) {
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

describe('POST /login', () => {
  test('should return 200 when provided credentials are valid', async () => {
    await createUser()

    const response = await request(app)
      .post('/login')
      .send({ username: credentials.username, password: credentials.password })

    expect(response.statusCode).toBe(200)
  })

  test('should return 401 when password is invalid', async () => {
    await createUser()

    const response = await request(app)
      .post('/login')
      .send({ username: credentials.username, password: 'PasswordIncorrecta' })

    expect(response.statusCode).toBe(401)
  })

  test('should return 401 if the user is not valid', async () => {
    const response = await request(app)
      .post('/login')
      .send({ username: 'noexiste@test.com', password: 'CualquierPassword123' })

    expect(response.statusCode).toBe(401)
  })

  test('should return 400 if the username is missing', async () => {
    const response = await request(app)
      .post('/login')
      .send({ password: credentials.password })

    expect(response.statusCode).toBe(400)
  })

  test('should return 400 if the password is missing', async () => {
    const response = await request(app)
      .post('/login')
      .send({ username: credentials.username })

    expect(response.statusCode).toBe(400)
  })
})
