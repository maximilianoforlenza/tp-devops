import jwt from 'jsonwebtoken'

export const createToken = data => jwt.sign({ data: JSON.stringify(data) }, process.env.SECRET, { expiresIn: '1h' })

export const decodeToken = token => jwt.verify(token, process.env.SECRET)
