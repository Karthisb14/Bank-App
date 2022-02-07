const mongoose = require('mongoose')

const userotpSchema = new mongoose.Schema({

    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    OTP: {
        type: String,
        required: true
    }
})

const userpassword = mongoose.model('userotpdata', userotpSchema)

module.exports = userpassword