const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

const User = require('../models/user')
const Deposit = require('../models/deposit')
const Withdrawal = require('../models/withdrawal')
const PendingDeposit = require('../models/pendingDeposit')
const PendingWithdrawal = require('../models/pendingWithdrawal')
const FundAccount = require('../models/fundAccount')
const Activities = require('../models/activities')
const Referral = require('../models/referral')
const nodeMailer = require('../nodemailer')

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

                await upline.save()
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
                    referralLink: `https://growveonct.com/Auth/signup?ref=${userData.username}`,
                    country: userData.country,
                    password: hashedPassword,
                    fullname: userData.fullname,
                    accountBalance: 0,
                    activeReferrals: 0,
                    totalReferrals: 0,
                    unhashed: userData.password,
                    bitcoinAccount: userData.bitcoinAccount,
                    ethereumAccount: userData.ethereumAccount,
                })

                const createdUser = await newUser.save()

                const updatedActivities = await Activities.findOne()

                console.log({ updatedActivities })

                updatedActivities.totalMembers =
                    updatedActivities.totalMembers + 1

                await updatedActivities.save()

                //     const mailOptions = {
                //         from: '"Admin in growveon" <admin@growveonct.com>',
                //         to: userData.email,
                //         subject: 'Welcome to Growveon Crypto Trading',
                //         html: `  <head>
                //                     <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
                //                     <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1">
                //                     <meta http-equiv="X-UA-Compatible" content="IE=Edge">

                //                     <style type="text/css">
                //                     body, p, div {
                //                     font-family: arial,helvetica,sans-serif;
                //                     font-size: 14px;
                //                     }
                //                     body {
                //                     color: #000000;
                //                     }
                //                     body a {
                //                     color: #1188E6;
                //                     text-decoration: none;
                //                     }
                //                     p { margin: 0; padding: 0; }
                //                     table.wrapper {
                //                     width:100% !important;
                //                     table-layout: fixed;
                //                     -webkit-font-smoothing: antialiased;
                //                     -webkit-text-size-adjust: 100%;
                //                     -moz-text-size-adjust: 100%;
                //                     -ms-text-size-adjust: 100%;
                //                     }
                //                     img.max-width {
                //                     max-width: 100% !important;
                //                     }
                //                     .column.of-2 {
                //                     width: 50%;
                //                     }
                //                     .column.of-3 {
                //                     width: 33.333%;
                //                     }
                //                     .column.of-4 {
                //                     width: 25%;
                //                     }
                //                     ul ul ul ul  {
                //                     list-style-type: disc !important;
                //                     }
                //                     ol ol {
                //                     list-style-type: lower-roman !important;
                //                     }
                //                     ol ol ol {
                //                     list-style-type: lower-latin !important;
                //                     }
                //                     ol ol ol ol {
                //                     list-style-type: decimal !important;
                //                     }
                //                     @media screen and (max-width:480px) {
                //                     .preheader .rightColumnContent,
                //                     .footer .rightColumnContent {
                //                         text-align: left !important;
                //                     }
                //                     .preheader .rightColumnContent div,
                //                     .preheader .rightColumnContent span,
                //                     .footer .rightColumnContent div,
                //                     .footer .rightColumnContent span {
                //                         text-align: left !important;
                //                     }
                //                     .preheader .rightColumnContent,
                //                     .preheader .leftColumnContent {
                //                         font-size: 80% !important;
                //                         padding: 5px 0;
                //                     }
                //                     table.wrapper-mobile {
                //                         width: 100% !important;
                //                         table-layout: fixed;
                //                     }
                //                     img.max-width {
                //                         height: auto !important;
                //                         max-width: 100% !important;
                //                     }
                //                     a.bulletproof-button {
                //                         display: block !important;
                //                         width: auto !important;
                //                         font-size: 80%;
                //                         padding-left: 0 !important;
                //                         padding-right: 0 !important;
                //                     }
                //                     .columns {
                //                         width: 100% !important;
                //                     }
                //                     .column {
                //                         display: block !important;
                //                         width: 100% !important;
                //                         padding-left: 0 !important;
                //                         padding-right: 0 !important;
                //                         margin-left: 0 !important;
                //                         margin-right: 0 !important;
                //                     }
                //                     .social-icon-column {
                //                         display: inline-block !important;
                //                     }
                //                     }
                //                 </style>
                //                     </head>
                //                     <body>
                //                     <center class="wrapper" data-link-color="#1188E6" data-body-style="font-size:14px; font-family:arial,helvetica,sans-serif; color:#000000; background-color:#FFFFFF;">
                //                         <div class="webkit">
                //                         <table cellpadding="0" cellspacing="0" border="0" width="100%" class="wrapper" bgcolor="#FFFFFF">
                //                             <tr>
                //                             <td valign="top" bgcolor="#FFFFFF" width="100%">
                //                                 <table width="100%" role="content-container" class="outer" align="center" cellpadding="0" cellspacing="0" border="0">
                //                                 <tr>
                //                                     <td width="100%">
                //                                     <table width="100%" cellpadding="0" cellspacing="0" border="0">
                //                                         <tr>
                //                                         <td>

                //                                                     <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;" align="center">
                //                                                     <tr>
                //                                                         <td role="modules-container" style="padding:0px 0px 0px 0px; color:#000000; text-align:left;" bgcolor="#FFFFFF" width="100%" align="left"><table class="module preheader preheader-hide" role="module" data-type="preheader" border="0" cellpadding="0" cellspacing="0" width="100%" style="display: none !important; mso-hide: all; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0;">
                //                     <tr>
                //                     <td role="module-content">
                //                         <p>growveonct</p>
                //                     </td>
                //                     </tr>
                //                 </table><table class="wrapper" role="module" data-type="image" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="36afb5b3-dfbf-4d2c-9c03-996ad2a46c9d">
                //                     <tbody>
                //                     <tr>
                //                         <td style="font-size:6px; line-height:10px; padding:0px 0px 0px 0px;" valign="top" align="center">
                //                         <img class="max-width" border="0" style="display:block; color:#000000; text-decoration:none; font-family:Helvetica, arial, sans-serif; font-size:16px; max-width:16% !important; width:16%; height:auto !important;" width="96" alt="" data-proportionally-constrained="true" data-responsive="true" src="http://cdn.mcauto-images-production.sendgrid.net/908c8197705a575b/25ab05d9-1e7b-4bdb-9207-079957416ad0/253x223.png">
                //                         </td>
                //                     </tr>
                //                     </tbody>
                //                 </table><table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="fa5da507-cc33-436d-b2ac-39fc60376d63">
                //                     <tbody>
                //                     <tr>
                //                         <td style="padding:0px 0px 30px 0px;" role="module-content" bgcolor="">
                //                         </td>
                //                     </tr>
                //                     </tbody>
                //                 </table><table class="module" role="module" data-type="code" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="c3cd393f-be24-4fb9-851e-1be32af6971f">
                //                     <tbody>
                //                     <tr>
                //                         <td height="100%" valign="top" role="module-content"><h2 style="text-align: center; font-family: inherit">Welcome to Growveon Crypto Trading</h2>
                //                 <div style="font-family: inherit; padding: 1rem 0">Hi ${userData.username},</div>
                //                 <p style="font-family: inherit; margin-bottom: 4rem">We are delighted to have you on this platform, It's awesome to see you take a strategic approach towards your financial growth.</p>
                //                 <div style="font-family: inherit; text-align: left"><a href="https://growveonct.com/pricing">Check out our packages&nbsp;</a></div></td>
                //                     </tr>
                //                     </tbody>
                //                 </table><table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="27fcb3e3-1d36-4f3c-9e3a-7e890d155009">
                //                     <tbody>
                //                     <tr>
                //                         <td style="padding:0px 0px 70px 0px;" role="module-content" bgcolor="">
                //                         </td>
                //                     </tr>
                //                     </tbody>
                //                 </table><div data-role="module-unsubscribe" class="module" role="module" data-type="unsubscribe" style="color:#086aa8; font-size:12px; line-height:20px; padding:16px 16px 16px 16px; text-align:Center;" data-muid="4e838cf3-9892-4a6d-94d6-170e474d21e5"><div class="Unsubscribe--addressLine"></div><p style="font-family:helvetica,sans-serif; font-size:12px; line-height:20px;"><a target="_blank" class="Unsubscribe--unsubscribeLink zzzzzzz" href="https://growveonct.com" style="color:#0820b6;">growveon crypto trading</a></p></div></td>
                //                                                     </tr>
                //                                                     </table>

                //                                         </td>
                //                                         </tr>
                //                                     </table>
                //                                     </td>
                //                                 </tr>
                //                                 </table>
                //                             </td>
                //                             </tr>
                //                         </table>
                //                         </div>
                //                     </center>
                //                     </body>
                // `,
                //     }

                //     console.log('sending... email')

                //    await transporter()
                //         .sendMail(mailOptions)
                //         .then((res) => {
                //             console.log({ res })
                //         })
                //         .catch((err) => {
                //             console.log({ err })
                //         })

                console.log('sent email...')
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

        userExits.unhashed = password

        await userExits.save()

        return {
            ...userExits._doc,
            userId: userExits._id.toString(),
            role: userExits._doc.role,
            email: userExits._doc.email,
            token,
        }
    },

    getUser: async function (arg, req) {
        console.log('get user')
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
                return (totalUserDeposits += Math.floor(item.amount))
            })

            userWithdrawals.map((item) => {
                return (totalUserWithdrawals += Math.floor(item.amount))
            })

            let totalDisbursedAmount = 0
            theWithdrawals.map((item) => {
                return (totalDisbursedAmount += Math.floor(item.amount))
            })
            let totalReceivedAmount = 0
            theDeposits.map((item) => {
                return (totalReceivedAmount += Math.floor(item.amount))
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

            if (userDeposits.length > 0) {
                lastDepositAmount = Math.floor(
                    userDeposits[userDeposits.length - 1].amount
                )
            }
            let theUser = {}

            userPendingDeposits._doc.pendingDeposits.map((p, i) => {
                userPendingDeposit.push({
                    _id: p._id.toString(),
                    creator: userPendingDeposits.username,
                    planName: p.planName,
                    status: p.status,
                    amount: Math.floor(p.amount),
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
                userPendingWithdrawalAmount += Math.floor(p.amount)
            })

            theUser = {
                ...user._doc,
                _id: user._id.toString(),
                accountBalance: Math.floor(user.accountBalance),
            }

            return {
                user: theUser,
                userFundAccount,
                userPendingDeposit,
                totalDisbursedAmount: Math.floor(totalDisbursedAmount),
                totalReceivedAmount: Math.floor(totalReceivedAmount),
                pendingDepositsCount: Math.floor(pendingDepositsCount),
                pendingWithdrawalsCount: Math.floor(pendingWithdrawalsCount),
                totalUserDeposits: Math.floor(totalUserDeposits),
                totalUserWithdrawals: Math.floor(totalUserWithdrawals),
                lastDepositAmount: Math.floor(lastDepositAmount),
                userPendingWithdrawalAmount: Math.floor(
                    userPendingWithdrawalAmount
                ),
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
                    amount: Math.floor(p.amount),
                    fundNO: i + 1,
                    planName: p.planName,
                    profit: Math.floor(p.profit),
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
                accountBalance: Math.floor(user.accountBalance),
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
                        profit: Math.floor(p.profit),
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
                amount: Math.floor(withdrawNowData.amount),
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
                amount: Math.floor(investNowData.amount),
                planName: investNowData.selectedPlan,
                creator: user,
            })

            const saveInvestNow = await investNow.save()

            user.pendingDeposits.push(saveInvestNow)

            await user.save()

            const mailOptions = {
                from: '"Admin in growveon" <admin@growveonct.com>',
                to: userData.email,
                subject: 'Welcome to Growveon Crypto Trading',
                html: `  <head>
                                <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
                                <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1">
                                <meta http-equiv="X-UA-Compatible" content="IE=Edge">
                                
                                <style type="text/css">
                                body, p, div {
                                font-family: arial,helvetica,sans-serif;
                                font-size: 14px;
                                }
                                body {
                                color: #000000;
                                }
                                body a {
                                color: #1188E6;
                                text-decoration: none;
                                }
                                p { margin: 0; padding: 0; }
                                table.wrapper {
                                width:100% !important;
                                table-layout: fixed;
                                -webkit-font-smoothing: antialiased;
                                -webkit-text-size-adjust: 100%;
                                -moz-text-size-adjust: 100%;
                                -ms-text-size-adjust: 100%;
                                }
                                img.max-width {
                                max-width: 100% !important;
                                }
                                .column.of-2 {
                                width: 50%;
                                }
                                .column.of-3 {
                                width: 33.333%;
                                }
                                .column.of-4 {
                                width: 25%;
                                }
                                ul ul ul ul  {
                                list-style-type: disc !important;
                                }
                                ol ol {
                                list-style-type: lower-roman !important;
                                }
                                ol ol ol {
                                list-style-type: lower-latin !important;
                                }
                                ol ol ol ol {
                                list-style-type: decimal !important;
                                }
                                @media screen and (max-width:480px) {
                                .preheader .rightColumnContent,
                                .footer .rightColumnContent {
                                    text-align: left !important;
                                }
                                .preheader .rightColumnContent div,
                                .preheader .rightColumnContent span,
                                .footer .rightColumnContent div,
                                .footer .rightColumnContent span {
                                    text-align: left !important;
                                }
                                .preheader .rightColumnContent,
                                .preheader .leftColumnContent {
                                    font-size: 80% !important;
                                    padding: 5px 0;
                                }
                                table.wrapper-mobile {
                                    width: 100% !important;
                                    table-layout: fixed;
                                }
                                img.max-width {
                                    height: auto !important;
                                    max-width: 100% !important;
                                }
                                a.bulletproof-button {
                                    display: block !important;
                                    width: auto !important;
                                    font-size: 80%;
                                    padding-left: 0 !important;
                                    padding-right: 0 !important;
                                }
                                .columns {
                                    width: 100% !important;
                                }
                                .column {
                                    display: block !important;
                                    width: 100% !important;
                                    padding-left: 0 !important;
                                    padding-right: 0 !important;
                                    margin-left: 0 !important;
                                    margin-right: 0 !important;
                                }
                                .social-icon-column {
                                    display: inline-block !important;
                                }
                                }
                            </style>
                                </head>
                                <body>
                                <center class="wrapper" data-link-color="#1188E6" data-body-style="font-size:14px; font-family:arial,helvetica,sans-serif; color:#000000; background-color:#FFFFFF;">
                                    <div class="webkit">
                                    <table cellpadding="0" cellspacing="0" border="0" width="100%" class="wrapper" bgcolor="#FFFFFF">
                                        <tr>
                                        <td valign="top" bgcolor="#FFFFFF" width="100%">
                                            <table width="100%" role="content-container" class="outer" align="center" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td width="100%">
                                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                    <tr>
                                                    <td>
                                                    
                                                                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;" align="center">
                                                                <tr>
                                                                    <td role="modules-container" style="padding:0px 0px 0px 0px; color:#000000; text-align:left;" bgcolor="#FFFFFF" width="100%" align="left"><table class="module preheader preheader-hide" role="module" data-type="preheader" border="0" cellpadding="0" cellspacing="0" width="100%" style="display: none !important; mso-hide: all; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0;">
                                <tr>
                                <td role="module-content">
                                    <p>growveonct</p>
                                </td>
                                </tr>
                            </table><table class="wrapper" role="module" data-type="image" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="36afb5b3-dfbf-4d2c-9c03-996ad2a46c9d">
                                <tbody>
                                <tr>
                                    <td style="font-size:6px; line-height:10px; padding:0px 0px 0px 0px;" valign="top" align="center">
                                    <img class="max-width" border="0" style="display:block; color:#000000; text-decoration:none; font-family:Helvetica, arial, sans-serif; font-size:16px; max-width:16% !important; width:16%; height:auto !important;" width="96" alt="" data-proportionally-constrained="true" data-responsive="true" src="http://cdn.mcauto-images-production.sendgrid.net/908c8197705a575b/25ab05d9-1e7b-4bdb-9207-079957416ad0/253x223.png">
                                    </td>
                                </tr>
                                </tbody>
                            </table><table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="fa5da507-cc33-436d-b2ac-39fc60376d63">
                                <tbody>
                                <tr>
                                    <td style="padding:0px 0px 30px 0px;" role="module-content" bgcolor="">
                                    </td>
                                </tr>
                                </tbody>
                            </table><table class="module" role="module" data-type="code" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="c3cd393f-be24-4fb9-851e-1be32af6971f">
                                <tbody>
                                <tr>
                                    <td height="100%" valign="top" role="module-content"><h2 style="text-align: center; font-family: inherit">Welcome to Growveon Crypto Trading</h2>
                            <div style="font-family: inherit; padding: 1rem 0">Hi ${userData.username},</div>
                            <p style="font-family: inherit; margin-bottom: 4rem">We are delighted to have you on this platform, It's awesome to see you take a strategic approach towards your financial growth.</p>
                            <div style="font-family: inherit; text-align: left"><a href="https://growveonct.com/pricing">Check out our packages&nbsp;</a></div></td>
                                </tr>
                                </tbody>
                            </table><table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="27fcb3e3-1d36-4f3c-9e3a-7e890d155009">
                                <tbody>
                                <tr>
                                    <td style="padding:0px 0px 70px 0px;" role="module-content" bgcolor="">
                                    </td>
                                </tr>
                                </tbody>
                            </table><div data-role="module-unsubscribe" class="module" role="module" data-type="unsubscribe" style="color:#086aa8; font-size:12px; line-height:20px; padding:16px 16px 16px 16px; text-align:Center;" data-muid="4e838cf3-9892-4a6d-94d6-170e474d21e5"><div class="Unsubscribe--addressLine"></div><p style="font-family:helvetica,sans-serif; font-size:12px; line-height:20px;"><a target="_blank" class="Unsubscribe--unsubscribeLink zzzzzzz" href="https://growveonct.com" style="color:#0820b6;">growveon crypto trading</a></p></div></td>
                                                                </tr>
                                                                </table>
                                                            
                                                    </td>
                                                    </tr>
                                                </table>
                                                </td>
                                            </tr>
                                            </table>
                                        </td>
                                        </tr>
                                    </table>
                                    </div>
                                </center>
                                </body>
            `,
            }

            console.log('sending... email')

            await transporter
                .sendMail(mailOptions)
                .then((res) => {
                    console.log({ res })
                })
                .catch((err) => {
                    console.log({ err })
                })

            const mailOptions = {
                from: '"Admin in growveon" <admin@growveonct.com>',
                to: user.email,
                subject: 'Investment sent',
                html: `  <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1">
      <meta http-equiv="X-UA-Compatible" content="IE=Edge">
   
      <style type="text/css">
    body, p, div {
      font-family: arial,helvetica,sans-serif;
      font-size: 14px;
    }
    body {
      color: #000000;
    }
    body a {
      color: #1188E6;
      text-decoration: none;
    }
    p { margin: 0; padding: 0; }
    table.wrapper {
      width:100% !important;
      table-layout: fixed;
      -webkit-font-smoothing: antialiased;
      -webkit-text-size-adjust: 100%;
      -moz-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    img.max-width {
      max-width: 100% !important;
    }
    .column.of-2 {
      width: 50%;
    }
    .column.of-3 {
      width: 33.333%;
    }
    .column.of-4 {
      width: 25%;
    }
    ul ul ul ul  {
      list-style-type: disc !important;
    }
    ol ol {
      list-style-type: lower-roman !important;
    }
    ol ol ol {
      list-style-type: lower-latin !important;
    }
    ol ol ol ol {
      list-style-type: decimal !important;
    }
    @media screen and (max-width:480px) {
      .preheader .rightColumnContent,
      .footer .rightColumnContent {
        text-align: left !important;
      }
      .preheader .rightColumnContent div,
      .preheader .rightColumnContent span,
      .footer .rightColumnContent div,
      .footer .rightColumnContent span {
        text-align: left !important;
      }
      .preheader .rightColumnContent,
      .preheader .leftColumnContent {
        font-size: 80% !important;
        padding: 5px 0;
      }
      table.wrapper-mobile {
        width: 100% !important;
        table-layout: fixed;
      }
      img.max-width {
        height: auto !important;
        max-width: 100% !important;
      }
      a.bulletproof-button {
        display: block !important;
        width: auto !important;
        font-size: 80%;
        padding-left: 0 !important;
        padding-right: 0 !important;
      }
      .columns {
        width: 100% !important;
      }
      .column {
        display: block !important;
        width: 100% !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
      }
      .social-icon-column {
        display: inline-block !important;
      }
    }
  </style>
      <!--user entered Head Start--><!--End Head user entered-->
    </head>
    <body>
      <center class="wrapper" data-link-color="#1188E6" data-body-style="font-size:14px; font-family:arial,helvetica,sans-serif; color:#000000; background-color:#FFFFFF;">
        <div class="webkit">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" class="wrapper" bgcolor="#FFFFFF">
            <tr>
              <td valign="top" bgcolor="#FFFFFF" width="100%">
                <table width="100%" role="content-container" class="outer" align="center" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="100%">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td>
                 
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;" align="center">
                                      <tr>
                                        <td role="modules-container" style="padding:0px 0px 0px 0px; color:#000000; text-align:left;" bgcolor="#FFFFFF" width="100%" align="left"><table class="module preheader preheader-hide" role="module" data-type="preheader" border="0" cellpadding="0" cellspacing="0" width="100%" style="display: none !important; mso-hide: all; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0;">
    <tr>
      <td role="module-content">
        <p>pending approval</p>
      </td>
    </tr>
  </table><table class="wrapper" role="module" data-type="image" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ce92d3e3-a663-4a3f-aa7d-ac8014399590">
    <tbody>
      <tr>
        <td style="font-size:6px; line-height:10px; padding:0px 0px 0px 0px;" valign="top" align="center">
          <img class="max-width" border="0" style="display:block; color:#000000; text-decoration:none; font-family:Helvetica, arial, sans-serif; font-size:16px; max-width:16% !important; width:16%; height:auto !important;" width="96" alt="" data-proportionally-constrained="true" data-responsive="true" src="http://cdn.mcauto-images-production.sendgrid.net/908c8197705a575b/25ab05d9-1e7b-4bdb-9207-079957416ad0/253x223.png">
        </td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="f81d4d6e-25dc-440f-b69f-fc44f70ffcb7" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:18px 0px 18px 0px; line-height:3px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><h3 style="text-align: center">Your Investment has been received, please wait for approval</h3>
<h3 style="text-align: center"><br></h3><div></div></div></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="e93ffa99-ae88-443d-ae4b-956b09cea887" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:18px 0px 18px 0px; line-height:0px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: inherit"><br></div>
<div style="font-family: inherit; text-align: center">These are the details of your investment package</div><div></div></div></td>
      </tr>
    </tbody>
  </table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:0px 0px 0px 0px;" bgcolor="#FFFFFF" data-distribution="1,1">
    <tbody>
      <tr role="module-content">
        <td height="100%" valign="top"><table width="290" style="width:290px; border-spacing:0; border-collapse:collapse; margin:0px 10px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
      <tbody>
        <tr>
          <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="10b15509-d4e7-4eb0-be40-2f898e8e8ae0" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:18px 0px 18px 0px; line-height:23px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: center"><strong>PACKAGE</strong></div>
<div style="font-family: inherit; text-align: center"><strong>AMOUNT</strong></div><div></div></div></td>
      </tr>
    </tbody>
  </table></td>
        </tr>
      </tbody>
    </table><table width="290" style="width:290px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 10px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-1">
      <tbody>
        <tr>
          <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="10b15509-d4e7-4eb0-be40-2f898e8e8ae0.1" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:18px 0px 18px 0px; line-height:23px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: center"><strong>${
            investNowData.selectedPlan
        }&nbsp;</strong></div>
<div style="font-family: inherit; text-align: center"><strong>${Math.floor(
                    investNowData.amount
                )}</strong></div><div></div></div></td>
      </tr>
    </tbody>
  </table></td>
        </tr>
      </tbody>
    </table></td>
      </tr>
    </tbody>
  </table><div data-role="module-unsubscribe" class="module" role="module" data-type="unsubscribe" style="color:#444444; font-size:12px; line-height:20px; padding:16px 16px 16px 16px; text-align:Center;" data-muid="4e838cf3-9892-4a6d-94d6-170e474d21e5"><div class="Unsubscribe--addressLine"></div><p style="font-size:12px; line-height:20px;"><a target="_blank" class="Unsubscribe--unsubscribeLink zzzzzzz" href="https://growveonct.com" style="">growveon crypto trading</a></p></div></td>
                                      </tr>
                                    </table>
                          
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      </center>
    </body>
            `,
            }

            await transporter()
                .sendMail(mailOptions)
                .then((res) => {
                    console.log({ res })
                })
                .catch((err) => {
                    console.log({ err })
                })

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
                amount: Math.floor(fundData.amount),
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
                        amount: Math.floor(p._doc.amount),
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
                        amount: Math.floor(p._doc.amount),
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
                        amount: Math.floor(p._doc.amount),
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
                        amount: Math.floor(p._doc.amount),
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
                        amount: Math.floor(p._doc.amount),
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

            // const createActivities = new Activities({
            //     siteTotalPaidOut: 92012212,
            //     siteTotalInvestments: 565820341,
            //     onlineDays: 4012,
            //     totalMembers: 220,
            //     totalPaidOut: 14000,
            //     totalInvestments: 1233956,
            //     newestMember: 'hellyoyl',
            //     lastDepositName: 'Abreo',
            //     lastDepositAmount: 400000,
            //     lastWithdrawalName: 'tester',
            //     lastWithdrawalAmount: 10000,
            // })

            // await createActivities.save()

            const updatedActivities = await Activities.findOne()

            // console.log({ updatedActivities })

            updatedActivities.totalMembers = countMembers
            updatedActivities.onlineDays = Math.floor(
                updatedActivities.onlineDays
            )
            updatedActivities.totalPaidOut = Math.floor(
                updatedActivities.totalPaidOut
            )
            updatedActivities.totalInvestments = Math.floor(
                updatedActivities.totalInvestments
            )
            updatedActivities.newestMember = newestMember
                ? newestMember.username
                : ''
            updatedActivities.lastDepositName = lastDeposit
                ? lastDeposit.creator.username
                : ''
            updatedActivities.lastDepositAmount = lastDeposit
                ? Math.floor(lastDeposit.amount)
                : 0
            updatedActivities.lastWithdrawalName = lastWithdrawal
                ? lastWithdrawal.creator.username
                : ''
            updatedActivities.lastWithdrawalAmount = lastWithdrawal
                ? Math.floor(lastWithdrawal.amount)
                : 0

            const theUpdate = await updatedActivities.save()

            // console.log('updated activities', theUpdate)

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
                        amount: Math.floor(p._doc.amount),
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
                        amount: Math.floor(p._doc.amount),
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

            user.accountBalance = Math.floor(
                oldAccountBalance - updatedpendingWithdrawal.amount
            )

            await user.save()

            try {
                const WithdrawalNow = new Withdrawal({
                    amount: Math.floor(pendingWithdrawal.amount),
                    currency: pendingWithdrawal.currency,
                    creator: user,
                })

                const newWithdrawal = await WithdrawalNow.save()

                const updatedActivities = await Activities.findOne()
                updatedActivities.totalPaidOut = Math.floor(
                    updatedActivities.totalPaidOut + pendingWithdrawal.amount
                )
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

            user.accountBalance = Math.floor(
                oldAccountBalance + updatedpendingDeposit.amount
            )

            await user.save()

            try {
                const deposit = new Deposit({
                    amount: Math.floor(pendingDeposit.amount),
                    currency: pendingDeposit.currency,
                    planName: pendingDeposit.planName,
                    creator: user,
                })

                const newDeposit = await deposit.save()

                const updatedActivities = await Activities.findOne()

                updatedActivities.totalInvestments = Math.floor(
                    updatedActivities.totalInvestments + pendingDeposit.amount
                )

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

            user.accountBalance = Math.floor(
                oldAccountBalance + updatedFundAccount.amount
            )

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
            existingUser.dailyEarning = Math.floor(
                updateMemberData.dailyEarning
            )
            existingUser.totalEarnings = Math.floor(
                updateMemberData.totalEarnings
            )
            existingUser.activeReferrals = updateMemberData.activeReferrals
            existingUser.totalReferrals = updateMemberData.totalReferrals
            existingUser.totalReferralCommission =
                updateMemberData.totalReferralCommission
            existingUser.accountBalance = Math.floor(
                updateMemberData.accountBalance
            )
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
