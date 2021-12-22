const express = require('express')
require('./database/db')
const bankRouter = require('./routers/app')

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use(bankRouter)


app.listen(port, () => {
    console.log('Server is up on port ' + port)
})