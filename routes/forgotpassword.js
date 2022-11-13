//express is the framework we're going to use to handle requests
const { response } = require('express')
const { request } = require('express')
const express = require('express')

//Access the connection to Heroku Database
const pool = require('../utilities').pool

const validation = require('../utilities').validation
let isStringProvided = validation.isStringProvided

const generateHash = require('../utilities').generateHash
const generateSalt = require('../utilities').generateSalt

const sendEmail = require('../utilities').sendEmail

const router = express.Router()

router.get("/", (request, res) => {
    // created group email for mailing purposes. mail sent from there
    var address = request.query.email
    if(request.query.email) {
        let theQuery = 'SELECT Password, Salt FROM Members WHERE Email=' + address
        let values = []
        pool.query(theQuery, values)
            .then(result => {
                if (result.rowCount == 0) {
                    res.status(404).send({
                        message: "User Information not found",
                        address: address,
                        theQuery: theQuery
                    })
                }  else {

                    //Retrieve the salt used to create the salted-hash provided from the DB
                    let salt = result.rows[0].salt
                    
                    //Retrieve the salted-hash password provided from the DB
                    let storedSaltedHash = result.rows[0].saltedhash
        
                    //Generate a hash based on the stored salt and the provided password
                    let providedSaltedHash = generateHash(req.oldPassword, salt)
        
                    if (storedSaltedHash === providedSaltedHash) {
                        next();
                    } else {
                        res.status(400).send('Bad request: Error 05')
                    }
                    
                    let update =`UPDATE Members 
                                SET Password=$1, Salt=$2 WHERE email=$3`
                    let vals = [mySaltNewPass, newSalt, address]
                    pool.query(update, vals)
                            .then(result => {
                                let message1 = "Your password with Group 1's app has been changed." +
                                " Your new password is:\n" + mySaltNewPass
                                res.status(201).send( {
                                    success: true,
                                    message: "Temporary password created"
                                })
                        sendEmail(sourceEmail, email, "changed", message1)
                    })
                    
                }
            })
            return 
    }
})

module.exports = router


