import express from 'express'

process.loadEnvFile()

const app = express()
const { PORT } = process.env

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(process.env.PORT, () => {
  console.log(`App listening on port ${PORT}`)
})
