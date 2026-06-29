import app from './app.js'
import connectDB from './src/helpers/database.js'

process.loadEnvFile()

const { PORT } = process.env

await connectDB()

app.listen(PORT, () => {
  console.log(`APP listening on port ${PORT}!`)
})
