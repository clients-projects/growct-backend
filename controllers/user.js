const { validationResult } = require('express-validator/check')

const User = require('../models/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

exports.postSignup = (req, res, next) => {
    const { email, password, username } = req.body

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect.')
        error.statusCode = 422
        error.errorMessage = errors.array()[0].msg
        throw error
    }

    bcrypt
        .hash(password, 12)
        .then((hashedPassword) => {
            const user = new User({
                email,
                username,
                password: hashedPassword,
                status: 'New user',
            })

            return user.save()
        })
        .then((result) => {
            res.status(201).json({ message: 'Successful signup' })
        })
        .catch((err) => {
            next(err)
        })
}

exports.postLogin = (req, res, next) => {
    const { email, password } = req.body

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect.')
        error.statusCode = 422
        error.errorMessage = errors.array()[0].msg
        throw error
    }

    User.findOne({ email })
        .then((user) => {
            if (!user) {
                const error = new Error('user validation failed')
                error.statusCode = 500
                throw error
            } else {
                bcrypt.compare(password, user.password).then((isEqual) => {
                    if (!isEqual) {
                        const error = new Error('Incorrect password')
                        error.statusCode = 401
                        throw error
                    }
                   
                    const token = jwt
                        .sign(
                            {  email: user.email, userId: user._id.toString() },
                            'supersecretkey',
                            { expiresIn: '1hr' }
                        )
                    res.status(201).json({ message: 'Successful login', token, userId: user._id.toString() })
                })
            }
        })

        .catch((err) => {
            console.log('the error', err)
            next(err)
        })
}
