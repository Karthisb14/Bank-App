const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const bankSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7
    },
    accountnumber: {
        type: Number,
        required: true,
        unique: true,
        trim: true,
        default: function(){
            let accountnumgen = Math.floor(1000000 + Math.random() * 9000000);
            return accountnumgen
        }
        
    },
    PIN: {
        type: Number,
        required: true,
        trim: true,
        lowercase: true,
        default: function(){
            let  pingenerate = Math.floor((Math.random() * 9000) + 1000)
            return pingenerate
        }
    },
    balance: {
        type: Number,
        required: true,
        validate(value){
            if(value === 0){
                throw new Error( 'Please Maintain Minimum Balance Rs 500')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
})

bankSchema.methods.toJSON = function() {
    const bankdata = this
    const bankobject = bankdata.toObject()

    delete bankobject.password
    delete bankobject.tokens
    
    return bankobject
}

bankSchema.methods.generateAuthToken = async function() {
    const authtoken = this
    
    const Gentoken = jwt.sign({ _id: authtoken._id.toString() }, 'banktask')

    authtoken.tokens = authtoken.tokens.concat({token: Gentoken})
    await authtoken.save()

    return Gentoken
}

bankSchema.statics.findByCredentials = async(email, password) => {
   
    const emailinfo = await bankapp.findOne({email: email})

    if(!emailinfo){
        throw new Error('Unable to login')
    }

    const ismatch = await bcrypt.compareSync(password, emailinfo.password)

    if(!ismatch){
        throw new Error('Unable to login')
    }
   
    return emailinfo
}

bankSchema.pre('save', async function(next){
    const bankpassword = this

    if(bankpassword.isModified('password')){
        bankpassword.password = await bcrypt.hash(bankpassword.password, 8)
    }
    
    next()
})

const bankapp = mongoose.model('account-information', bankSchema)

module.exports = bankapp