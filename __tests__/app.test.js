import request from 'supertest'

import app from '../app.js'

import { credentials, createUser, connectTestDB, disconnectTestDB, clearTestDB } from './jest.setup.js'

describe('Test the root path', () => {
  test('should response the GET method', async () => {
    const response = await request(app).get('/')
    expect(response.statusCode).toBe(200)
  })
})

describe('GET /health', () => {
  test('should return status ok', async () => {
    const response = await request(app).get('/health')
    expect(response.statusCode).toBe(200)
    expect(response.body.status).toBe('ok')
  })
})

describe('GET /error', () => {
  test('should return 500', async () => {
    const response = await request(app).get('/error')
    expect(response.statusCode).toBe(500)
  })
})

describe('GET /ping', () => {
  test('should return version', async () => {
    const response = await request(app).get('/ping')
    expect(response.statusCode).toBe(200)
    expect(response.body).toHaveProperty('version')
  })
})

describe('protected endpoints', () => {
  let token
  let userCreated

  beforeAll(async () => {
    await connectTestDB()
  })

  afterAll(async () => {
    await disconnectTestDB()
  })

  beforeEach(async () => {
    userCreated = await createUser()
    const response = await request(app)
      .post('/login')
      .send({ username: credentials.username, password: credentials.password })
    token = response.body.token
  })

  afterEach(async () => {
    await clearTestDB()
  })

  describe('GET /users', () => {
    test('should return all users', async () => {
      const response = await request(app).get('/users').set('Authorization', `Bearer ${token}`)
      expect(response.statusCode).toBe(200)
      expect(response.body.users).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Usuario Test', email: 'usuario@test.com', active: true, role: 'user' })
        ])
      )
    })
  })

  describe('GET /users/{id}', () => {
    test('should return a user that matches with the id', async () => {
      const response = await request(app).get(`/users/${userCreated._id}`).set('Authorization', `Bearer ${token}`)
      expect(response.statusCode).toBe(200)
      expect(response.body.user).toEqual(expect.objectContaining({ name: 'Usuario Test', email: 'usuario@test.com', active: true, role: 'user' }))
    })

    test('should return 404 when the user does not exist', async () => {
      const response = await request(app).get('/users/6a46d87ae27ceb25e6972a5a').set('Authorization', `Bearer ${token}`)
      expect(response.statusCode).toBe(404)
    })
  })
})
