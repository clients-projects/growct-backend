const path = require('path')

const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const multer = require('multer')
const helmet = require('helmet')
const compression = require('compression')

const auth = require('./middleware/is-Auth')

const { graphqlHTTP } = require('express-graphql')
const graphqlSchema = require('./graphql/schema')
const graphqlResolver = require('./graphql/resolvers')

const app = express()

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname)
    },
})

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true)
    } else {
        cb(null, false)
    }
}

app.use(bodyParser.json())
app.use(multer({ storage, fileFilter }).single('image'))
app.use('/images', express.static(path.join(__dirname, 'images')))

app.use(helmet())

app.use(compression())

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader(
        'Access-Control-Allow-Methods',
        'OPTIONS, GET, POST, PUT, PATCH, DELETE'
    )
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200)
    }
    next()
})

app.get('/', (req, res) => {
    res.send('Welcome to Main Growveon cryptotrading')
})

app.use(auth)


app.use(
    '/api/graphql',
    graphqlHTTP({
        schema: graphqlSchema,
        rootValue: graphqlResolver,
        graphiql: true,
        customFormatErrorFn(err) {
            if (!err.originalError) {
                return err
            }

            const message = err.message || 'An error occurred'
            const statusCode = err.originalError.statusCode || 500
            const data = err.originalError.data

            return {
                message,
                statusCode,
                data,
            }
        },
    })
)

app.use((error, req, res, next) => {
    console.log(error, error.errorMessage)
    const status = error.statusCode || 500
    const message = error.message
    res.status(status).json({ message: message })
})
console.log('the env process', process.env.NODE_ENV)

const PORT = process.env.PORT || 3030

console.log('the env port', process.env.PORT)

mongoose
    .connect(
        `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.wicfq.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`,
        { useUnifiedTopology: true, useNewUrlParser: true }
    )
    .then((result) => {
        console.log('Connected to', PORT)
        app.listen(PORT)

        // transporter()
        //     .verify()
        //     .then((res) => {
        //         console.log('connected to nodemailer', res)
        //     })
        //     .catch((err) => {
        //         console.log('not connected to nodemailer', err)
        //     })
    })
    .catch((err) => console.log(err))
