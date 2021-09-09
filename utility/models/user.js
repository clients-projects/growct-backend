const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
        },

        email: {
            type: String,
            required: true,
        },

        role: {
            type: String,
            default: 'Customer',
            required: true,
        },

        status: {
            type: String,
            required: true,
            default: 'Active',
        },
        upline: {
            type: String,
        },
        referralLink: {
            type: String,
        },

        password: {
            type: String,
            required: true,
        },
        fullname: {
            type: String,
            required: true,
        },
        country: {
            type: String,
        },
        phoneNumber: {
            type: String,
        },
        city: {
            type: String,
        },
        bitcoinAccount: {
            type: String,
        },
        ethereumAccount: {
            type: String,
        },
        notification: {
            type: String,
        },

        totalReferralCommission: {
            type: Number,
            default: 0,
        },
        totalReferrals: {
            type: Number,
            default: 0,
        },
        activeReferrals: {
            type: Number,
            default: 0,
        },
        totalEarnings: {
            type: Number,
            default: 0,
        },

        dailyEarning: {
            type: Number,
            default: 0,
        },

        accountBalance: {
            type: Number,
            required: true,
            default: '0',
        },

        referrals: [
            {
                type: Object,
                ref: 'referral',
            },
        ],
        pendingDeposits: [
            {
                type: Schema.Types.ObjectId,
                ref: 'pendingDeposit',
            },
        ],
        pendingWithdrawals: [
            {
                type: Schema.Types.ObjectId,
                ref: 'pendingWithdrawal',
            },
        ],
        totalDeposits: [
            {
                type: Schema.Types.ObjectId,
                ref: 'deposit',
            },
        ],
        totalWithdrawals: [
            {
                type: Schema.Types.ObjectId,
                ref: 'withdraw',
            },
        ],
    },
    { timestamps: true }
)

module.exports = mongoose.model('users', userSchema)
