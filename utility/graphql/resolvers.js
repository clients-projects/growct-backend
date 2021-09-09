const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

//const nodeMailer = require('nodemailer')

const User = require('../models/user')
const Deposit = require('../models/deposit')
const Withdrawal = require('../models/withdrawal')
const PendingDeposit = require('../models/pendingDeposit')
const PendingWithdrawal = require('../models/pendingWithdrawal')
const FundAccount = require('../models/fundAccount')
const Activities = require('../models/activities')
const Referral = require('../models/referral')

const fileDelete = require('../utility/deleteFile')
const user = require('../models/user')

// const mailTransport = nodeMailer.createTransport({
//     host: 'smtp.mailtrap.io',
//     port: 2525,
//     auth: {
//         user: '3d41967e762911',
//         pass: '36b27c6a4a7d02',
//     },
// })

module.exports = {
    createUser: async function ({ userData }, req) {
        console.log('userData', userData)
        const error = []
        if (
            !validator.isEmail(userData.email) ||
            validator.isEmpty(userData.email)
        ) {
            error.push({ message: 'Invalid Email Field' })
        }
        if (
            !validator.isLength(userData.username, { min: 3 }) ||
            validator.isEmpty(userData.username)
        ) {
            error.push({
                message: 'Username must be at least 6 characters long',
            })
        }
        if (
            !validator.isLength(userData.password, { min: 6 }) ||
            validator.isEmpty(userData.password)
        ) {
            error.push({
                message: 'Password must be at least 6 characters long',
            })
        }

        if (error.length > 0) {
            const err = new Error('Invalid User Input')
            err.statusCode = 422
            err.data = error
            throw err
        }

        const existingUser = await User.findOne({ email: userData.email })
        const existingUsername = await User.findOne({
            username: userData.username,
        })

        if (userData.referral) {
            const upline = await User.findOne({ username: userData.referral })

            if (!upline) {
                throw new Error('upline does not exit')
            } else {
                upline.totalReferrals = upline.totalReferrals + 1
                upline.activeReferrals = upline.activeReferrals + 1

                upline.referrals.push({
                    username: userData.username,
                })

                const updatedUpline = await upline.save()
            }
        }

        if (existingUser) {
            const error = new Error('User already exists')
            throw error
        }

        if (existingUsername) {
            throw new Error('Username already taken')
        }
        try {
            const hashedPassword = await bcrypt.hash(userData.password, 12)

            if (hashedPassword) {
                const newUser = new User({
                    username: userData.username,
                    email: userData.email,
                    city: userData.city,
                    upline: userData.referral,
                    referralLink: `https://robot44trade.com/Auth/signup?ref=${userData.username}`,
                    country: userData.country,
                    password: hashedPassword,
                    fullname: userData.fullname,
                    bitcoinAccount: userData.bitcoinAccount,
                    ethereumAccount: userData.ethereumAccount,
                })

                const createdUser = await newUser.save()

                const updatedActivities = await Activities.findOne()

                updatedActivities.totalMembers =
                    updatedActivities.totalMembers + 1

                await updatedActivities.save()

                if (createdUser) {
                    return {
                        ...createdUser._doc,
                        _id: createdUser._id.toString(),
                    }
                }
            }
        } catch (err) {
            throw new Error(err)
        }
    },

    login: async function ({ email, password }) {
        const error = []

        if (!validator.isEmail(email) || validator.isEmpty(email)) {
            error.push({ message: 'Invalid Email Field' })
        }

        if (
            !validator.isLength(password, { min: 6 }) ||
            validator.isEmpty(password)
        ) {
            error.push({
                message: 'Password must be at least 6 characters long',
            })
        }

        if (error.length > 0) {
            const err = new Error('Invalid User Input')
            err.statusCode = 422
            err.data = error
            throw err
        }

        const userExits = await User.findOne({ email })

        if (!userExits) {
            const error = new Error('User does not exist')
            error.statusCode = 401
            throw error
        }

        const checkPassword = await bcrypt.compare(password, userExits.password)

        if (!checkPassword) {
            const error = new Error('Incorrect Password')
            error.statusCode = 401
            throw error
        }

        const token = jwt.sign(
            { email: userExits.email, userId: userExits._id.toString() },
            'supersecretkey',
            { expiresIn: '3hr' }
        )

        // const mailSent = await mailTransport.sendMail({
        //     to: email,
        //     from: 'support@coinperfectinvestment.com',
        //     subject: 'Successful sign up',
        //     html: '<h3>We welcome you to the home of the best cryto trading and investment!!</h3>'

        // })

        return {
            ...userExits._doc,
            userId: userExits._id.toString(),
            role: userExits._doc.role,
            email: userExits._doc.email,
            token,
        }
    },

    getUser: async function (arg, req) {
        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }
        try {
            const user = await User.findById(req.userId).populate('fundAccount')

            const fundAccountCount = await User.findById(req.userId)
                .populate('fundAccount')
                .countDocuments()

            const userPendingDeposits = await User.findById(
                req.userId
            ).populate('pendingDeposits')
            const userPendingWithdrawals = await User.findById(
                req.userId
            ).populate('pendingWithdrawals')

            const pendingDepositsCount = await PendingDeposit.find({
                status: 'Pending',
            }).countDocuments()
            const pendingWithdrawalsCount = await PendingWithdrawal.find({
                status: 'Pending',
            }).countDocuments()
            const theWithdrawals = await Withdrawal.find()
            const theDeposits = await Deposit.find()
            const userDeposits = await Deposit.find({ creator: req.userId })
            const userWithdrawals = await Withdrawal.find({
                creator: req.userId,
            })


            let totalUserDeposits = 0
            let totalUserWithdrawals = 0

            userDeposits.map((item) => {
                return (totalUserDeposits += item.amount)
            })

            userWithdrawals.map((item) => {
                return (totalUserWithdrawals += item.amount)
            })

            let totalDisbursedAmount = 0
            theWithdrawals.map((item) => {
                return (totalDisbursedAmount += item.amount)
            })
            let totalReceivedAmount = 0
            theDeposits.map((item) => {
                return (totalReceivedAmount += item.amount)
            })

            if (!user) {
                const error = new Error('User not found')
                error.statusCode = 404
                throw error
            }

            
            const userFundAccount = []
            const userPendingDeposit = []
            let userPendingWithdrawalAmount = 0
            let lastDepositAmount = 0

            if(userDeposits.length > 0){

                lastDepositAmount = userDeposits[userDeposits.length - 1].amount
            }
            let theUser = {}
            
            userPendingDeposits._doc.pendingDeposits.map((p, i) => {
                userPendingDeposit.push({
                    _id: p._id.toString(),
                    creator: userPendingDeposits.username,
                    planName: p.planName,
                    status: p.status,
                    amount: p.amount,
                    fundNO: i + 1,
                    currency: p.currency,
                    createdAt: p.createdAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                    updatedAt: p.updatedAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                })
            })
            userPendingWithdrawals._doc.pendingWithdrawals.map((p, i) => {
                userPendingWithdrawalAmount += p.amount
            })

            theUser = {
                ...user._doc,
                _id: user._id.toString(),
            }

            return {
                user: theUser,
                userFundAccount,
                userPendingDeposit,
                totalDisbursedAmount,
                totalReceivedAmount,
                pendingDepositsCount,
                pendingWithdrawalsCount,
                totalUserDeposits,
                totalUserWithdrawals,
                lastDepositAmount,
                userPendingWithdrawalAmount,
                userDeposits,
                userWithdrawals,
                fundAccountCount,
            }
        } catch (err) {
            console.log('the error of get user', err)
        }
    },
    getMember: async function ({ id }, req) {
        console.log('get user', id)
        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }
        try {
            const user = await User.findById(id)

            const theUserDeposits = await Deposit.find({ creator: id })
            const userWithdrawals = await Withdrawal.find({
                creator: id,
            })

            if (!user) {
                const error = new Error('User not found')
                error.statusCode = 404
                throw error
            }

            let theUser = {}
            let userDeposits = []
            let memberId = []

            theUserDeposits.map((p, i) => {
                userDeposits.push({
                    _id: p._id.toString(),
                    amount: p.amount,
                    fundNO: i + 1,
                    planName: p.planName,
                    profit: p.profit,
                    currency: p.currency,
                    createdAt: p.createdAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                    updatedAt: p.updatedAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                })
            })
            theUserDeposits.map((p, i) => {
                memberId.push({
                    _id: p._id.toString(),
                })
            })

            theUser = {
                ...user._doc,
                _id: user._id.toString(),
            }

            return {
                user: theUser,
                userDeposits,
                userWithdrawals,
                memberId,
            }
        } catch (err) {
            console.log('the error of get member', err)
        }
    },

    getUsers: async function (arg, req) {
        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }
        const getUsers = await User.find({ role: 'Customer' })

        if (!getUsers) {
            const error = new Error('No Users')
            error.statusCode = 404
            throw error
        }

        return {
            getUser: getUsers.map((p, i) => {
                return {
                    ...p._doc,
                    _id: p._id.toString(),
                    userNO: i + 1,
                    createdAt: p.createdAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                    updatedAt: p.updatedAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                }
            }),
            getUsersId: getUsers.map((p, i) => {
                return {
                    ...p._doc,
                    _id: p._id.toString(),
                }
            }),
        }
    },
    getAdmin: async function (arg, req) {
        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }
        const getAdmin = await User.findOne({ role: 'Admin' })

        if (!getAdmin) {
            const error = new Error('Admin not found')
            error.statusCode = 404
            throw error
        }

        return {
            ...getAdmin._doc,
            _id: getAdmin._id.toString(),
            createdAt: getAdmin.createdAt.toLocaleString('en-GB', {
                hour12: true,
            }),
            updatedAt: getAdmin.updatedAt.toLocaleString('en-GB', {
                hour12: true,
            }),
        }
    },
    getUserHistory: async function (arg, req) {
        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }
        const user = await User.findById(req.userId)
        const withdrawal = await Withdrawal.find({
            creator: req.userId,
        }).populate('creator')
        const deposit = await Deposit.find({ creator: req.userId }).populate(
            'creator'
        )

        if (!user) {
            const error = new Error('User not found!')
            error.statusCode = 404
            throw error
        }

        try {
            return {
                getDepositHistory: deposit.map((p, i) => {
                    return {
                        ...p._doc,
                        _id: p._id.toString(),
                        historyNO: i + 1,
                        profit: p.profit,
                        createdAt: p.createdAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                        updatedAt: p.updatedAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                    }
                }),
                getWithdrawalHistory: withdrawal.map((p, i) => {
                    return {
                        ...p._doc,
                        _id: p._id.toString(),
                        historyNO: i + 1,
                        createdAt: p.createdAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                        updatedAt: p.updatedAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                    }
                }),
            }
        } catch (err) {
            console.log(err)
        }
    },

    createWithdrawNow: async function ({ withdrawNowData }, req) {
        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }

        const user = await User.findById(req.userId)

        if (!user) {
            const err = new Error('Invalid User')
            err.statusCode = 422
            throw err
        }

        try {
            const PendingWithdrawalNow = new PendingWithdrawal({
                amount: withdrawNowData.amount,
                currency: withdrawNowData.currency,
                creator: user,
            })

            const savePendingWithdrawNow = await PendingWithdrawalNow.save()

            user.pendingWithdrawals.push(savePendingWithdrawNow)

            
            await user.save()
            
            return {
                ...savePendingWithdrawNow._doc,
                _id: savePendingWithdrawNow._id.toString(),
                createdAt: savePendingWithdrawNow.createdAt.toLocaleString(
                    'en-GB',
                    {
                        hour12: true,
                    }
                ),
                updatedAt: savePendingWithdrawNow.updatedAt.toLocaleString(
                    'en-GB',
                    {
                        hour12: true,
                    }
                ),
            }
        } catch (err) {
            console.log('err', err)
            throw new Error(err)
        }
    },

    createInvestNow: async function ({ investNowData }, req) {
        console.log('invest now', investNowData)
        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }

        const user = await User.findById(req.userId)

        if (!user) {
            const err = new Error('Invalid User')
            err.statusCode = 422
            throw err
        }

        try {
            const investNow = new PendingDeposit({
                amount: investNowData.amount,
                planName: investNowData.selectedPlan,
                creator: user,
            })

            const saveInvestNow = await investNow.save()

            user.pendingDeposits.push(saveInvestNow)

             await user.save()

            return {
                ...saveInvestNow._doc,
                _id: saveInvestNow._id.toString(),
                createdAt: saveInvestNow.createdAt.toLocaleString('en-GB', {
                    hour12: true,
                }),
                updatedAt: saveInvestNow.updatedAt.toLocaleString('en-GB', {
                    hour12: true,
                }),
            }
        } catch (err) {
            console.log('err', err)
            throw new Error(err)
        }
    },
    createFundAccount: async function ({ fundData }, req) {
        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }

        const user = await User.findById(req.userId)

        if (!user) {
            const err = new Error('Invalid User')
            err.statusCode = 422
            throw err
        }

        try {
            const fundAccount = new FundAccount({
                amount: fundData.amount,
                currency: fundData.currency,
                creator: user,
            })

            await fundAccount.save()
            const saveFundAccount = await fundAccount.save()

            user.fundAccount.push(saveFundAccount)

            await user.save()

            return {
                ...saveFundAccount._doc,
                _id: saveFundAccount._id.toString(),
                createdAt: saveFundAccount.createdAt.toLocaleString('en-GB', {
                    hour12: true,
                }),
                updatedAt: saveFundAccount.updatedAt.toLocaleString('en-GB', {
                    hour12: true,
                }),
            }
        } catch (err) {
            console.log('err', err)
            throw new Error(err)
        }
    },

    getFunds: async function (arg, req) {
        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }

        try {
            const getFunds = await FundAccount.find().populate('creator')

            const pendingDeposit = await PendingDeposit.find().populate(
                'creator'
            )

            const pendingWithdrawal = await PendingWithdrawal.find().populate(
                'creator'
            )
            const allUsersDeposit = await Deposit.find().populate('creator')
            const allUsersWithdrawal = await Withdrawal.find().populate(
                'creator'
            )

            if (!getFunds) {
                const err = new Error('No Funds for Funding')
                err.statusCode = 422
                throw err
            }
            if (!pendingDeposit) {
                const err = new Error('No pending deposit')
                err.statusCode = 422
                throw err
            }
            if (!pendingWithdrawal) {
                const err = new Error('No pending withdrawal')
                err.statusCode = 422
                throw err
            }
            if (!allUsersDeposit) {
                const err = new Error('No Users deposit')
                err.statusCode = 422
                throw err
            }
            if (!allUsersWithdrawal) {
                const err = new Error('No Users withdrawal')
                err.statusCode = 422
                throw err
            }
            const theCreator = []
            const thePendingDeposit = []
            const thePendingWithdrawal = []
            const theAllUsersDeposit = []
            const theAllUsersWithdrawal = []

            return {
                getFund: getFunds.map((p, i) => {
                    theCreator.push({
                        _id: p._id.toString(),
                        creator: p.creator.username,
                        status: p._doc.status,
                        amount: p._doc.amount,
                        currency: p._doc.currency,
                        fundNO: i + 1,
                        createdAt: p.createdAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                        updatedAt: p.updatedAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                    })
                    return {
                        ...p._doc,
                        _id: p._id.toString(),
                    }
                }),
                getPendingDeposit: pendingDeposit.map((p, i) => {
                    thePendingDeposit.push({
                        _id: p._id.toString(),
                        creator: p.creator.username,
                        status: p._doc.status,
                        planName: p._doc.planName,
                        amount: p._doc.amount,
                        currency: p._doc.currency,
                        fundNO: i + 1,
                        createdAt: p.createdAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                        updatedAt: p.updatedAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                    })
                    return {
                        ...p._doc,
                        _id: p._id.toString(),
                    }
                }),
                getPendingWithdrawal: pendingWithdrawal.map((p, i) => {
                    thePendingWithdrawal.push({
                        _id: p._id.toString(),
                        creator: p.creator.username,
                        status: p._doc.status,
                        planName: p._doc.planName,
                        amount: p._doc.amount,
                        currency: p._doc.currency,
                        fundNO: i + 1,
                        createdAt: p.createdAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                        updatedAt: p.updatedAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                    })
                    return {
                        ...p._doc,
                        _id: p._id.toString(),
                    }
                }),
                getAllUsersDeposit: allUsersDeposit.map((p, i) => {
                    theAllUsersDeposit.push({
                        _id: p._id.toString(),
                        creator: p.creator.username,
                        planName: p._doc.planName,
                        amount: p._doc.amount,
                        currency: p._doc.currency,
                        fundNO: i + 1,
                        createdAt: p.createdAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                        updatedAt: p.updatedAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                    })
                    return {
                        ...p._doc,
                        _id: p._id.toString(),
                    }
                }),
                getAllUsersWithdrawal: allUsersWithdrawal.map((p, i) => {
                    theAllUsersWithdrawal.push({
                        _id: p._id.toString(),
                        creator: p.creator.username,
                        amount: p._doc.amount,
                        currency: p._doc.currency,
                        fundNO: i + 1,
                        createdAt: p.createdAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                        updatedAt: p.updatedAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                    })
                    return {
                        ...p._doc,
                        _id: p._id.toString(),
                    }
                }),
                fundData: theCreator,
                thePendingDeposit,
                thePendingWithdrawal,
                theAllUsersDeposit,
                theAllUsersWithdrawal,
            }
        } catch (err) {
            console.log(err)
        }
    },
    getActivities: async function (arg, req) {
        console.log('get activies', arg)
        try {
            const newestMember = await User.findOne({ role: 'Customer' }).sort({
                createdAt: -1,
            })
            const countMembers = await User.find().countDocuments()
            const lastDeposit = await Deposit.findOne()
                .sort({ createdAt: -1 })
                .populate('creator')
            const lastWithdrawal = await Withdrawal.findOne()
                .sort({ createdAt: -1 })
                .populate('creator')

            const updatedActivities = await Activities.findOne()

            updatedActivities.totalMembers = countMembers
            updatedActivities.onlineDays = updatedActivities.onlineDays
            updatedActivities.totalPaidOut = updatedActivities.totalPaidOut
            updatedActivities.totalInvestments =
                updatedActivities.totalInvestments
            updatedActivities.newestMember = newestMember ? newestMember.username : ''
            updatedActivities.lastDepositName = lastDeposit ? lastDeposit.creator.username : ''
            updatedActivities.lastDepositAmount = lastDeposit ? lastDeposit.amount : 0
            updatedActivities.lastWithdrawalName =
                lastWithdrawal ? lastWithdrawal.creator.username : ''
            updatedActivities.lastWithdrawalAmount = lastWithdrawal ? lastWithdrawal.amount : 0

            const theUpdate = await updatedActivities.save()

            console.log('updated activities', theUpdate)

            // console.log('lastDeposit', lastDeposit)
            // console.log('lastWithdrawal', lastWithdrawal)
            // console.log('newestMember', newestMember)
            // console.log('count members', countMembers)

            // const activities = new Activities({
            //     onlineDays: 0,
            //     totalMembers: 0,
            //     totalPaidOut: 0,
            //     totalInvestments: 0,
            //     newestMember: newestMember.username,
            //     lastDepositName: lastDeposit.creator.username,
            //     lastDepositAmount: lastDeposit.amount,
            //     lastWithdrawalName: lastWithdrawal.creator.username,
            //     lastWithdrawalAmount: lastWithdrawal.amount
            // })

            // let updatedActivities = await activities.save()

            // console.log('the updated activities', updatedActivities)

            const allUsersDeposit = await Deposit.find()
                .sort({ createdAt: -1 })
                .populate('creator')
            const allUsersWithdrawal = await Withdrawal.find()
                .sort({ createdAt: -1 })
                .populate('creator')

            if (!allUsersDeposit) {
                const err = new Error('No Users deposit')
                err.statusCode = 422
                throw err
            }
            if (!allUsersWithdrawal) {
                const err = new Error('No Users withdrawal')
                err.statusCode = 422
                throw err
            }
            const theAllUsersDeposit = []
            const theAllUsersWithdrawal = []

            return {
                getAllUsersDeposit: allUsersDeposit.map((p, i) => {
                    theAllUsersDeposit.push({
                        _id: p._id.toString(),
                        creator: p.creator.username,
                        planName: p._doc.planName,
                        amount: p._doc.amount,
                        currency: p._doc.currency,
                        fundNO: i + 1,
                        createdAt: p.createdAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                        updatedAt: p.updatedAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                    })
                    return {
                        ...p._doc,
                        _id: p._id.toString(),
                    }
                }),
                getAllUsersWithdrawal: allUsersWithdrawal.map((p, i) => {
                    theAllUsersWithdrawal.push({
                        _id: p._id.toString(),
                        creator: p.creator.username,
                        amount: p._doc.amount,
                        currency: p._doc.currency,
                        fundNO: i + 1,
                        createdAt: p.createdAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                        updatedAt: p.updatedAt.toLocaleString('en-GB', {
                            hour12: true,
                        }),
                    })
                    return {
                        ...p._doc,
                        _id: p._id.toString(),
                    }
                }),
                theAllUsersDeposit,
                theAllUsersWithdrawal,
                updatedActivities,
            }
        } catch (err) {
            console.log(err)
        }
    },
    createWithdrawNowApproval: async function ({ PostId }, req) {
        let id = mongoose.Types.ObjectId(PostId.id)

        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }

        const pendingWithdrawal = await PendingWithdrawal.findById(id).populate(
            'creator'
        )

        if (!pendingWithdrawal) {
            const error = new Error('Funds not found!')
            error.statusCode = 404
            throw error
        }

        //Delete Picture
        // post.title = postData.title
        // post.content = postData.content
        // if (postData.imageUrl !== 'undefined') {
        //     post.imageUrl = postData.imageUrl
        // }

        const oldStatus = pendingWithdrawal.status

        if (oldStatus !== 'Approved') {
            pendingWithdrawal.status = 'Approved'
        } else {
            const error = new Error('Withdrawal already approved')
            error.statusCode = 404
            throw error
        }

        const updatedpendingWithdrawal = await pendingWithdrawal.save()

        if (updatedpendingWithdrawal) {
            const user = await User.findById(pendingWithdrawal.creator._id)

            let oldAccountBalance = user.accountBalance

            user.accountBalance =
                oldAccountBalance - updatedpendingWithdrawal.amount

            await user.save()

            try {
                const WithdrawalNow = new Withdrawal({
                    amount: pendingWithdrawal.amount,
                    currency: pendingWithdrawal.currency,
                    creator: user,
                })

                const newWithdrawal = await WithdrawalNow.save()

                const updatedActivities = await Activities.findOne()
                updatedActivities.totalPaidOut =
                    updatedActivities.totalPaidOut + pendingWithdrawal.amount
                await updatedActivities.save()

                return {
                    ...newWithdrawal._doc,
                    _id: newWithdrawal._id.toString(),
                    createdAt: newWithdrawal.createdAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                    updatedAt: newWithdrawal.updatedAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                }
            } catch (err) {
                console.log(err)
            }
        }
    },
    createInvestNowApproval: async function ({ PostId }, req) {
        let id = mongoose.Types.ObjectId(PostId.id)

        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }

        const pendingDeposit = await PendingDeposit.findById(id).populate(
            'creator'
        )

        if (!pendingDeposit) {
            const error = new Error('Funds not found!')
            error.statusCode = 404
            throw error
        }

        //Delete Picture
        // post.title = postData.title
        // post.content = postData.content
        // if (postData.imageUrl !== 'undefined') {
        //     post.imageUrl = postData.imageUrl
        // }

        const oldStatus = pendingDeposit.status

        if (oldStatus !== 'Approved') {
            pendingDeposit.status = 'Approved'
        } else {
            const error = new Error('Deposit already approved')
            error.statusCode = 404
            throw error
        }

        const updatedpendingDeposit = await pendingDeposit.save()

        if (updatedpendingDeposit) {
            const user = await User.findById(pendingDeposit.creator._id)

            let oldAccountBalance = user.accountBalance

            user.accountBalance =
                oldAccountBalance - updatedpendingDeposit.amount

            await user.save()

            try {
                const deposit = new Deposit({
                    amount: pendingDeposit.amount,
                    currency: pendingDeposit.currency,
                    planName: pendingDeposit.planName,
                    creator: user,
                })

                const newDeposit = await deposit.save()

                const updatedActivities = await Activities.findOne()

                updatedActivities.totalInvestments =
                    updatedActivities.totalInvestments + pendingDeposit.amount

                await updatedActivities.save()

                return {
                    ...newDeposit._doc,
                    _id: newDeposit._id.toString(),
                    createdAt: newDeposit.createdAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                    updatedAt: newDeposit.updatedAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                }
            } catch (err) {
                console.log(err)
            }
        }
    },
    createFundAccountApproval: async function ({ PostId }, req) {
        let id = mongoose.Types.ObjectId(PostId.id)

        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }

        //5fa0813980bf2e7f8371931e
        const fundAccount = await FundAccount.findById(id).populate('creator')

        if (!fundAccount) {
            const error = new Error('Funds not found!')
            error.statusCode = 404
            throw error
        }

        //Delete Picture
        // post.title = postData.title
        // post.content = postData.content
        // if (postData.imageUrl !== 'undefined') {
        //     post.imageUrl = postData.imageUrl
        // }
        const oldStatus = fundAccount.status

        if (oldStatus !== 'Approved') {
            fundAccount.status = 'Approved'
        } else {
            const error = new Error('Deposit already approved')
            error.statusCode = 404
            throw error
        }

        const updatedFundAccount = await fundAccount.save()

        if (updatedFundAccount) {
            const user = await User.findById(fundAccount.creator._id)

            let oldAccountBalance = user.accountBalance

            user.accountBalance = oldAccountBalance + updatedFundAccount.amount

            await user.save()

            return {
                ...updatedFundAccount._doc,
                _id: updatedFundAccount._id.toString(),
                createdAt: updatedFundAccount.createdAt.toLocaleString(
                    'en-GB',
                    {
                        hour12: true,
                    }
                ),
                updatedAt: updatedFundAccount.updatedAt.toLocaleString(
                    'en-GB',
                    {
                        hour12: true,
                    }
                ),
            }
        }
    },

    //Profile

    createUpdateProfile: async function ({ updateProfileData }, req) {
        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }

        try {
            const existingUser = await User.findOne({
                email: updateProfileData.oldEmail,
            })

            if (updateProfileData.password !== '') {
                const hashedPassword = await bcrypt.hash(
                    updateProfileData.password,
                    12
                )
                existingUser.password = hashedPassword
            }
            existingUser.username = updateProfileData.username
            existingUser.email = updateProfileData.email
            existingUser.fullname = updateProfileData.fullname
            existingUser.city = updateProfileData.city
            existingUser.country = updateProfileData.country
            existingUser.phone = updateProfileData.phone
            existingUser.bitcoinAccount = updateProfileData.bitcoinAccount
            existingUser.ethereumAccount = updateProfileData.ethereumAccount

            const updatedUser = await existingUser.save()

            if (updatedUser) {
                return {
                    ...updatedUser._doc,
                    _id: updatedUser._id.toString(),
                    updatedAt: updatedUser.updatedAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                    createdAt: updatedUser.createdAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                }
            }
        } catch (err) {
            console.log('update failed', err)
        }
    },
    createUpdateMember: async function ({ updateMemberData }, req) {
        console.log('update member data', updateMemberData)
        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }

        try {
            const existingUser = await User.findOne({
                email: updateMemberData.oldEmail,
            })

            if (updateMemberData.password !== '') {
                const hashedPassword = await bcrypt.hash(
                    updateMemberData.password,
                    12
                )
                existingUser.password = hashedPassword
            }
            existingUser.username = updateMemberData.username
            existingUser.email = updateMemberData.email
            existingUser.fullname = updateMemberData.fullname
            existingUser.city = updateMemberData.city
            existingUser.dailyEarning = updateMemberData.dailyEarning
            existingUser.totalEarnings = updateMemberData.totalEarnings
            existingUser.activeReferrals = updateMemberData.activeReferrals
            existingUser.totalReferrals = updateMemberData.totalReferrals
            existingUser.totalReferralCommission =
                updateMemberData.totalReferralCommission
            existingUser.accountBalance = updateMemberData.accountBalance
            existingUser.country = updateMemberData.country
            existingUser.phone = updateMemberData.phone
            existingUser.bitcoinAccount = updateMemberData.bitcoinAccount
            existingUser.ethereumAccount = updateMemberData.ethereumAccount

            const updatedUser = await existingUser.save()

            if (updatedUser) {
                return {
                    ...updatedUser._doc,
                    _id: updatedUser._id.toString(),
                    updatedAt: updatedUser.updatedAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                    createdAt: updatedUser.createdAt.toLocaleString('en-GB', {
                        hour12: true,
                    }),
                }
            }
        } catch (err) {
            console.log('update failed', err)
        }
    },

    createUpdateProfit: async function ({ updateProfitData, id }, req) {
        console.log('update profit data', updateProfitData, id)

        if (!req.Auth) {
            const err = new Error('Not authenticated')
            err.statusCode = 403
            throw err
        }

        const theDeposit = await Deposit.findById(id)

        console.log('found deposit', theDeposit)

        if (!theDeposit) {
            throw new Error('user deposit not found!')
        }

        try {
            theDeposit.profit = updateProfitData.profit

            const updatedDeposit = await theDeposit.save()

            console.log('updated deposit', updatedDeposit)
            return {
                ...updatedDeposit._doc,
                _id: updatedDeposit._id.toString(),
                planName: updatedDeposit.planName,
                updatedAt: updatedDeposit.updatedAt.toLocaleString('en-GB', {
                    hour12: true,
                }),
                createdAt: updatedDeposit.createdAt.toLocaleString('en-GB', {
                    hour12: true,
                }),
            }
        } catch (err) {
            console.log('update failed', err)
        }
    },
}
