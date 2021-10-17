const nodeMailer = require('nodemailer')

exports.transporter = function() {
    console.log('nodemailer connected')
    nodeMailer
        .createTransport({
            host: 'mail.growveonct.com',
            port: 587,
            secure: false,
            requireTLS: true,
            socketTimeout: 1200000,
            connectionTimeout: 1200000,
            auth: {
                user: 'admin@growveonct.com',
                pass: 'Panther1.?)0',
            },
            tls: {
                rejectUnauthorized: false,
            },
        })
        .verify()
        .then((res) => {
            console.log('connected to nodemailer', res)
        })
        .catch((err) => {
            console.log('not connected to nodemailer', err)
        })
}
