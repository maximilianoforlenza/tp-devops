import request from 'supertest'

import app from '../app.js'

describe('Test the root path', () => {
  test('should response the GET method', done => {
    request(app)
      .get('/')
      .then(response => {
        expect(response.statusCode).toBe(200)
        done()
      })
  })
})

describe('GET /health', () => {
  test('should return status ok', done => {
    request(app)
      .get('/health')
      .then(response => {
        expect(response.statusCode).toBe(200)
        expect(response.body.status).toBe('ok')
        done()
      })
  })
})

describe('GET /error', () => {
  test('should return 500', done => {
    request(app)
      .get('/error')
      .then(response => {
        expect(response.statusCode).toBe(500)
        done()
      })
  })
})

describe('GET /ping', () => {
  test('should return version', done => {
    request(app)
      .get('/ping')
      .then(response => {
        expect(response.statusCode).toBe(200)
        expect(response.body).toHaveProperty('version')
        done()
      })
  })
})
