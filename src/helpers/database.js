import mongoose from 'mongoose'

const connectDB = async () => {
  const uri = process.env.MONGO_URI

  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables')
  }

  try {
    await mongoose.connect(uri)
    console.log('MongoDB connected successfully')
  } catch (error) {
    console.error('MongoDB connection error:', error.message)
    process.exit(1)
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected')
  })

  mongoose.connection.on('error', (error) => {
    console.error('MongoDB error:', error.message)
  })
}

export default connectDB
