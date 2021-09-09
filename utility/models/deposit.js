const mongoose = require('mongoose')
const Schema = mongoose.Schema

const depositSchema = new Schema(
    {
        amount: {
            type: Number,
            required: true,
        },
        planName: {
            type: String,
            required: true,
        },
        profit: {
            type: Number,
            default: 0
        },
        creator: {
            type: Schema.Types.ObjectId,
            ref: 'users',
            required: true,
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('deposit', depositSchema)
