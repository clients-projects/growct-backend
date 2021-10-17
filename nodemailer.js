const nodeMailer = require('nodemailer')

exports.transporter = function () {

    return nodeMailer.createTransport({
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
}
