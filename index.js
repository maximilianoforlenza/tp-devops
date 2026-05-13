import app from './app.js'

process.loadEnvFile()

const { PORT } = process.env

app.listen(PORT, () => {
  console.log('APP listening on port 5678!')
})
