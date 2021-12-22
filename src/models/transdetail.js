const mongoose = require('mongoose')

const transSchema = new mongoose.Schema({
    accnumber:{
        type: Number,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true
    },
    account_id:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'bankapp'
    },
    transacation_type:{
        type: String
    },

    transaction_id: {
        type: Number,
        required: true,
        unique: true,
        trim: true,
        default: function(){
            return Math.floor((Math.random() * 90000) + 10000)
        }
    }, 
},{
    timestamps: true
})

const banktransaction = mongoose.model('transaction', transSchema)
module.exports = banktransaction