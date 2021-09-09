const mongoose = require('mongoose')
const Schema = mongoose.Schema

const pendingDepositSchema = new Schema(
    {
        amount: {
            type: Number,
            required: true,
        },
        planName: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            required: true,
            default: 'Pending'
        },
        currency: {
            type: String,
        },
        creator: {
            type: Schema.Types.ObjectId,
            ref: 'users',
            required: true,
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('pendingDeposit', pendingDepositSchema)
