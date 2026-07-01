import mongoose from 'mongoose'
import crypto from 'crypto'
import { promisify } from 'util'

const scrypt = promisify(crypto.scrypt)
const passwordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    password: { type: String, required: true },
    salt: {
      type: String,
      required: true
    }
  }
)

passwordSchema.pre('validate', async function () {
  if (!this.isModified('password')) return

  const salt = crypto.randomBytes(16).toString('hex')
  const hashBuffer = await scrypt(this.password, salt, 64)

  this.password = hashBuffer.toString('hex')
  this.salt = salt
})

passwordSchema.methods.comparePassword = async function (password) {
  const hashBuffer = await scrypt(password, this.salt, 64)
  const hash = hashBuffer.toString('hex')

  return crypto.timingSafeEqual(
    Buffer.from(this.password, 'hex'),
    Buffer.from(hash, 'hex')
  )
}

const Password = mongoose.model('Password', passwordSchema)

export default Password
