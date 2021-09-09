const { buildSchema } = require('graphql')

module.exports = buildSchema(`

    type FundAccount {
        _id: ID!
        amount: Int!
        currency: String
        creator: User!
        planName: String
        username: String
        status: String
        profit: Int
        totalReferralCommission: Int
        totalReferrals: Int
        activeReferrals: Int
        fundNO: Int
        historyNO: Int
        createdAt: String!
        updatedAt: String!
    }



    type User {
        _id: ID!
        username: String!
        email: String!
        fullname: String!
        password: String!
        accountBalance: Int!
        totalWithdrawal: Int!
        totalDeposit: Int!
        approvedFunds: Int!
        dailyEarning: Int
        totalEarnings: Int
        ethereumAccount: String
        bitcoinAccount: String
        referralLink: String
        activeReferrals: Int
        totalReferrals: Int
        totalReferralCommission: Int
        referrals: [FundAccount!]!
        upline: String
        city: String
        phone: String
        country: String
        role: String!
        userNO: Int
        historyNO: Int
        status: String!
        createdAt: String!
        updatedAt: String!
        FundAccount: [FundAccount!]!
    }

    type AuthData {
        token: String!
        userId: String!
        role: String!
        email: String!
    }

    input UserInputData {
        username: String!
        email: String!
        referral: String
        fullname: String!
        password: String!
        ethereumAccount: String
        bitcoinAccount: String
    }
    type ProfileData {
        username: String
        email: String
        fullname: String
        password: String
        city: String
        phone: String
         activeReferrals: Int
        totalReferrals: Int
        accountBalance: Int
        totalReferralCommission: Int
        profilePic: String
        country: String
        ethereumAccount: String
        bitcoinAccount: String
        createdAt: String
        updatedAt: String
    }
    input PostProfileData {
        username: String
        email: String
        oldEmail: String
        activeReferrals: String
        totalReferrals: String
        accountBalance: String
        totalReferralCommission: String
        profilePic: String
        dailyEarning: String
        totalEarnings: String
        fullname: String
        password: String
        city: String
        profit: String
        phone: String
        country: String
        ethereumAccount: String
        bitcoinAccount: String
    }

    input PostFundData {
        amount: String
        currency: String!
    }
    input PostInvestNowData {
        amount: String!
        selectedPlan: String!
    }
    input PostWithdrawNowData {
        amount: String
        currency: String!
        password: String
    }

    input PostId {
        id: String
    }
    
    type RootMutation {
        createUser(userData: UserInputData): User!
        createFundAccount(fundData: PostFundData): FundAccount!
        createInvestNow(investNowData: PostInvestNowData): FundAccount!
        createWithdrawNow(withdrawNowData: PostWithdrawNowData): FundAccount!
        createUpdateProfile(updateProfileData: PostProfileData): ProfileData!
        createUpdateProfit(id: ID!, updateProfitData: PostProfileData): FundAccount!
        createUpdateMember(updateMemberData: PostProfileData): ProfileData!
        createFundAccountApproval(PostId: PostId): FundAccount!
        createInvestNowApproval(PostId: PostId): FundAccount!
        createWithdrawNowApproval(PostId: PostId): FundAccount!
        updatePost(id: ID!, postData: PostFundData): FundAccount!
        deletePost(id: ID!): Boolean
        updateStatus(status: String!): User!
    }

    type getFundsData {
        status: String
        amount: Int
        currency: String
        planName: String
        creator: String
        fundNO: Int
        createdAt: String
        updatedAt: String
    }
    type PostData {
        FundAccount: [FundAccount!]!
        totalPosts: Int!
        lastPage: Int
    }

    type activityData {
        onlineDays: Int
        totalMembers: Int
        newestMember: String
        totalPaidOut: Int
        totalInvestments: Int
        lastDepositName: String
        lastDepositAmount: Int
        lastWithdrawalName: String
        lastWithdrawalAmount: Int
    }

    type getFundData {
        fundData: [getFundsData!]!   
        thePendingDeposit: [getFundsData!]!
        getPendingDeposit: [FundAccount!]!
        thePendingWithdrawal: [getFundsData!]!
        getPendingWithdrawal: [FundAccount!]!
        getAllUsersDeposit: [FundAccount!]!
        getAllUsersWithdrawal: [FundAccount!]!
        theAllUsersDeposit: [getFundsData!]!
        theAllUsersWithdrawal: [getFundsData!]!
        getFund: [FundAccount!]!

    }
    type getUsersData {
        getUser: [User!]! 
        getUsersId: [User!]!
        userFundAccount: [FundAccount!]!    
    }
    
    type getUserHistoryData {
        getDepositHistory: [FundAccount!]!
        getWithdrawalHistory: [FundAccount!]!
    }

    type getUserData {
        user: User!
        userFundAccount: [FundAccount!]!    
        userPendingDeposit: [FundAccount!]!    
        userPendingWithdrawal: [FundAccount!]!    
        userDeposits: [FundAccount!]!    
        lastDepositAmount: Int
        userPendingWithdrawalAmount: Int,
        memberId: [FundAccount!]!    
        userWithdrawals: [FundAccount!]!    
        totalDisbursedAmount: Int!
        totalReceivedAmount: Int!
        pendingDepositsCount: Int!
        pendingWithdrawalsCount: Int!
        totalUserDeposits: Int!
        totalUserWithdrawals: Int!
        fundAccountCount: Int!
    }
    type getActivitiesData {
        updatedActivities: activityData
        theAllUsersDeposit: [getFundsData!]!
        theAllUsersWithdrawal: [getFundsData!]!
    }

    type rootQuery{
        login(email: String, password: String): AuthData!
        getFunds: getFundData!
        getPosts(page: Int): PostData!
        post(id: ID!): FundAccount!
        getUser: getUserData!
        getMember(id: ID!): getUserData!
        getActivities: getActivitiesData
        getAdmin: User
        getUsers: getUsersData!
        getUserHistory: getUserHistoryData!
    }

    schema {
        query: rootQuery
        mutation: RootMutation
    }
`)
