import request from 'supertest'

import app from '../app.js'
import { credentials, createUser, connectTestDB, disconnectTestDB, clearTestDB } from './jest.setup.js'

beforeAll(async () => {
  await connectTestDB()
})

afterAll(async () => {
  await disconnectTestDB()
})

afterEach(async () => {
  await clearTestDB()
})

describe('POST /login', () => {
  test('should return 200 when provided credentials are valid', async () => {
    await createUser()

    const response = await request(app)
      .post('/login')
      .send({ username: credentials.username, password: credentials.password })

    expect(response.statusCode).toBe(200)
    expect(response.token).not.toBeNull()
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

  test('should return 422 if the username is missing', async () => {
    const response = await request(app)
      .post('/login')
      .send({ password: credentials.password })

    expect(response.statusCode).toBe(422)
  })

  test('should return 422 if the password is missing', async () => {
    const response = await request(app)
      .post('/login')
      .send({ username: credentials.username })

    expect(response.statusCode).toBe(422)
  })
})
