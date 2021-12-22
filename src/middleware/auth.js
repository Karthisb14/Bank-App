const jwt = require('jsonwebtoken')
const bankapp = require('../models/bankmodels')

const auth = async(req, res, next) => {
    
    try{
        const token = req.header('Authorization').replace('Bearer ', '')
        const decodetoken = jwt.verify(token, 'banktask')
        const accountdetails = await bankapp.findOne({ _id: decodetoken._id, 'tokens.token': token})

        if(!accountdetails){
            throw new Error()
        }
        
        req.token = token
        req.accountdetails = accountdetails

        next()

    }catch(e){
        res.status(401).send({ error: 'please authenticate'})
    }

}

module.exports = auth