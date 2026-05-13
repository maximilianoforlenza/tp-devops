import express from 'express'

process.loadEnvFile()

const app = express()

app.get('/', (req, res) => {
  res.send('Hello World!')
})

export default app
