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


router.get("/", (req, res) => {

    const memberid = req.decoded.memberid;
    const email = req.body.email



    if(isStringProvided(email)) {
        const theQuery = `SELECT saltedhash, salt, Credentials.memberid FROM Credentials
                          INNER JOIN Members ON
                          Credentials.memberid=Members.memberid 
                          WHERE Members.memberid=$1`
        const values = [memberid]
        pool.query(theQuery, values)
            .then(result => {
                if (result.rowCount == 0) {
                    res.status(404).send({
                        message: "User Information not found",
                        address: email,
                        memberid: memberid
                    })
                }else{
                    req.memberid = result.rows[0].memberid
                    next()
                }
            })
            .catch((error) => {
                console.log("member lookup")
                console.log(error)
            })
    }
}, (req, res) => {

    let salt = generateSalt(32)
    let newSaltedHash = generateHash("randomPassword", salt) //hash for new password

    const theQuery = 'UPDATE CREDENTIALS SET saltedhash = $1, salt = $2 WHERE MemberID = $3'
    const values = [salted_hash, salt, memberid]

    pool.query(theQuery, values)
    .then(result => {
        res.status(201).send({
            success: true,
            message: "Temporary password created"
        })
    })
    .catch((error) => {
        console.log("Member update")
        console.log(error)
    })
})


module.exports = router



// }  else {
//     let salt = generateSalt(32)
//     let newSaltedHash = generateHash("randomPassword", salt) //hash for new password
//     const theQuery = 'UPDATE CREDENTIALS SET saltedhash = $1, salt = $2 WHERE email = $3'
//     const values = [newSaltedHash, salt, email]
//     pool.query(theQuery, values)
//             .then(result => {
//                 res.status(201).send( {
//                     success: true,
//                     message: "Temporary password created"
//                 })
//                 sendEmail("tcss450chat@gmail.com", request.body.email, "New Temporary Password", 'Your new password: ' + newPassword)
//     })
    
// }