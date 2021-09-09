const mongoose = require('mongoose')
const Schema = mongoose.Schema

const referralSchema = new Schema(
    {
        username: {
            type: String,
        },

    },
    { timestamps: true }
)

module.exports = mongoose.model('referral', referralSchema)
