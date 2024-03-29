const express = require('express')
const bankapp = require('../models/bankmodels')
const banktransaction = require('../models/transdetail')
const userpassword = require('../models/userotp')
const auth = require('../middleware/auth')
const bcrypt = require('bcryptjs')
const sgMail = require('@sendgrid/mail')

const router = new express.Router()

router.post('/bankapp/signup', async (req, res) => {
    const accountcreate = new bankapp(req.body)

    const transactiondetails = new banktransaction({
        accnumber: accountcreate.accountnumber,
        transacation_type: 'credit',
        amount: accountcreate.balance,
        account_id: accountcreate._id
    })

    try {
        const token = await accountcreate.generateAuthToken()
        await accountcreate.save()
        await transactiondetails.save()
        res.status(201).send({ accountcreate, token })
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/bankapp/login', async (req, res) => {

    try {
        const accountlogin = await bankapp.findByCredentials(req.body.email, req.body.password)
        const token = await accountlogin.generateAuthToken()
        res.send({ accountlogin, token })
    } catch (e) {
        res.status(400).send()
    }
})

router.post('/bankapp/logout', auth, async (req, res) => {
    try {
        req.accountdetails.tokens = req.accountdetails.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.accountdetails.save()
        res.send()

    } catch (e) {
        res.status(500).send()

    }
})

router.patch('/bankapp/deposit', auth, async (req, res) => {

    const accountprofile = req.accountdetails
    const deposit = accountprofile.balance + req.body.balance

    if (accountprofile.accountnumber !== req.body.accountnumber) {
        res.send({ error: 'Invalid Accountnumber' })
    }

    if (accountprofile.PIN !== req.body.PIN) {
        res.send({ error: 'Invalid PIN' })
    }

    const transactiondeposit = new banktransaction({
        accnumber: accountprofile.accountnumber,
        amount: req.body.balance,
        transacation_type: 'credit',
        account_id: accountprofile._id
    })

    try {

        const updateamount = await bankapp.findOneAndUpdate({ accountnumber: req.body.accountnumber, PIN: req.body.PIN }, { balance: deposit }, { new: true })
        await updateamount.save()
        await transactiondeposit.save()
        res.send(updateamount)

    } catch (e) {
        res.status(400).send()
    }

})

router.patch('/bankapp/withdraw', auth, async (req, res) => {

    const accountprofile = req.accountdetails
    const withdraw = accountprofile.balance - req.body.balance

    if (withdraw < 0) {
        return res.send({ error: 'Insufficient balance' })
    }

    if (accountprofile.accountnumber !== req.body.accountnumber) {
        res.send({ error: 'Invalid Accountnumber' })
    }

    if (accountprofile.PIN !== req.body.PIN) {
        res.send({ error: 'Invalid PIN' })
    }

    const transactionwithdraw = new banktransaction({
        accnumber: accountprofile.accountnumber,
        amount: req.body.balance,
        transacation_type: 'debit',
        account_id: accountprofile._id
    })

    try {
        const withdrawamount = await bankapp.findOneAndUpdate({ accountnumber: req.body.accountnumber, PIN: req.body.PIN }, { balance: withdraw }, { new: true })
        await withdrawamount.save()
        await transactionwithdraw.save()
        res.status(200).send(withdrawamount)

    } catch (e) {
        res.status(400).send()
    }
})

router.post('/bankapp/amount-transfer', auth, async (req, res) => {

    const loginuser = req.accountdetails
    const transferamount = loginuser.balance - req.body.balance

    if (transferamount < 0) {
        return res.status(400).send({ error: 'Insufficient balance' })
    }

    // // 1st user
    const updatebalance = await bankapp.findOneAndUpdate({ accountnumber: loginuser.accountnumber }, { balance: transferamount }, { new: true })

    const updateamount2 = await bankapp.findOne({ accountnumber: req.body.accountnumber })
    const update2 = updateamount2.balance + req.body.balance

    const transactiondata = new banktransaction({
        accnumber: loginuser.accountnumber,
        amount: req.body.balance,
        account_id: loginuser._id,
        transacation_type: 'debit'
    })

    const transactioncredit = new banktransaction({
        accnumber: req.body.accountnumber,
        amount: req.body.balance,
        account_id: loginuser._id,
        transacation_type: 'credit',
    })

    try {
        // 2nd user
        const amttransfer = await bankapp.findOneAndUpdate({ accountnumber: req.body.accountnumber }, { balance: update2 }, { new: true })
        await updatebalance.save()
        await amttransfer.save()
        await transactiondata.save()
        await transactioncredit.save()
        res.send({ sucess: 'transaction Completed Successfully!' })
    } catch (e) {
        res.status(400).send()
    }

})


router.patch('/bankapp/password', auth, async (req, res) => {

    const cryptppassword = req.accountdetails.password

    const matchpassword = await bcrypt.compare(req.body.currentpassword, cryptppassword)

    if (!matchpassword) {
        return res.send({ error: 'Invalid Current password' })
    }
    const hashpassword = await bcrypt.hash(req.body.password, 8)
    console.log(hashpassword)

    try {
        const updatepassword = await bankapp.findOneAndUpdate({ email: req.body.email }, { password: hashpassword }, { new: true })

        if (!updatepassword) {
            res.send(e)
        }
        await updatepassword.save()
        res.send(updatepassword)

    } catch (e) {
        res.status(400).send()
    }

})

router.patch('/bankapp/Pinupdate', auth, async (req, res) => {

    const pindata = req.accountdetails

    if (pindata.accountnumber !== req.body.accountnumber) {
        res.send({ error: 'Invalid accountnumber' })
    }

    try {

        const updatePIN = await bankapp.findOneAndUpdate({ accountnumber: req.body.accountnumber }, { PIN: req.body.PIN }, { new: true })
        await updatePIN.save()
        res.send(updatePIN)

    } catch (e) {
        res.status(400).send()
    }
})

router.get('/bankapp/balancecheck', auth, async (req, res) => {

    const balancecheck = req.accountdetails

    if (balancecheck.accountnumber !== req.body.accountnumber) {
        res.send({ error: 'Invalid accountdetails' })
    }

    if (balancecheck.PIN !== req.body.PIN) {
        res.send({ error: 'Invalid PIN' })
    }

    try {
        res.send({ balance: req.accountdetails.balance })
    } catch {
        res.status(400).send()

    }
})

router.get('/bankapp/transactiondetails', auth, async (req, res) => {

    if (req.accountdetails.accountnumber !== req.body.accountnumber) {
        res.status(400).send({ error: 'Invalid accountnumber' })
    }

    try {
        const transactionhistory = await banktransaction.find({ account: req.body.accountnumber }).sort({ createdAt: -1 }).limit(5);

        if (!transactionhistory) {
            res.send(e)
        }
        res.status(200).send(transactionhistory)
    } catch (e) {
        res.status(400).send()
    }
})

router.post('/bankapp/forgotpassword', async (req, res) => {

    try {
        const userfound = await bankapp.findOne({ email: req.body.email })
        // console.log(data)

        if (!userfound) {
            return res.status(400).send({ error: 'Invalid Email' })
        }

        const GenOTP = Math.random().toString(36).substring(2, 8)

        const userdata = new userpassword({
            user_id: userfound._id,
            OTP: GenOTP
        })

        sgMail.setApiKey('sendgridapikey')
        sgMail.send({
            to: req.body.email,
            from: 'karthisb14@gmail.com',
            subject: 'Password Reset',
            text: `Your One time password for forgot password recovery is ${GenOTP}`
        })

        await userdata.save()
        res.status(200).send({ sucess: 'email is send to your given mail id' })
    } catch (e) {
        res.status(400).send(e)
    }

})

router.post('/bankapp/otp', async (req, res) => {

    const Onetimepassword = await userpassword.findOne({OTP: req.body.otp})

    if(!Onetimepassword){
        return res.status(400).send({error: 'Invalid OTP'})
    }

    res.status(200).send()

})

router.patch('/bankapp/resetpassword', async( req, res) => {

    const hashpassword = await bcrypt.hash(req.body.newpassword, 8)

    const matchpassword = await bcrypt.compare(req.body.confirmpassword, hashpassword)

    if (!matchpassword) {
        return res.status(400).send({ error: 'Invalid password' })
    }

    try{

        const forgotpassword = await bankapp.findOneAndUpdate({email: req.body.email}, {password: hashpassword}, {new: true})

        if(!forgotpassword){
            return res.status(400).send({error:'Invalid Email'})
        }

        res.send(forgotpassword)

    }catch(e){
        res.status(400).send()
    }
})


module.exports = router