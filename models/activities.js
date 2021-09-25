const mongoose = require('mongoose')
const Schema = mongoose.Schema

const activitiesSchema = new Schema(
    {
        onlineDays: {
            type: Number,
        },
        totalMembers: {
            type: Number,
        },
        totalPaidOut: {
            type: Number,
        },
        totalInvestments: {
            type: Number,
        },
        lastDepositName: {
            type: String,
        },

        lastDepositAmount: {
            type: Number,
        },
        lastWithdrawalName: {
            type: String,
        },

        lastWithdrawalAmount: {
            type: Number,
        },

        newestMember: {
            type: String,
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('activities', activitiesSchema)
