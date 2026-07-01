import app from './app.js'
import connectDB from './src/helpers/database.js'

try {
  process.loadEnvFile()
} catch {
  console.log('.env is not provided')
}

const { PORT } = process.env

await connectDB()

app.listen(PORT, () => {
  console.log(`APP listening on port ${PORT}!`)
})
