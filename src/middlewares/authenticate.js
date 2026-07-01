import { decodeToken } from '../helpers/token.js'
import User from '../models/User.js'

export default async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).send('Authentication required')
    }

    const token = authHeader.split(' ')[1]

    const decodedToken = decodeToken(token)
    const user = await User.findOne({ _id: JSON.parse(decodedToken.data)._id, active: { $ne: false } }, { _id: 1, email: 1 })
    if (user) {
      req.user = user
      next()
    } else {
      return res.status(401)
    }
  } catch (err) {
    next(err)
  }
}
