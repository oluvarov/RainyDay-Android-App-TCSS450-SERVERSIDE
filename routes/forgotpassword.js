//express is the framework we're going to use to handle requests
const { response } = require('express')
const { request } = require('express')
const express = require('express') 
const pool = require('../utilities/exports').pool

const url = require('url');
const querystring = require('querystring');
const { nextTick } = require('process');
const e = require('express');

const generateHash = require('../utilities').generateHash
const generateSalt = require('../utilities').generateSalt

const sendEmail = require('../utilities').sendEmail

const validation = require('../utilities').validation
let isStringProvided = validation.isStringProvided

const router = express.Router()

/**
 * @api {post} / Request to generate password
 * @apiName postPassword
 * @apiGroup forgotpassword
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * @apiParam {Number} email of user
 * 
 * @apiSuccess (200: Success) {JSON} sends email
 * 
 * @apiError (400: Bad Request) {String} message "🚫Bad request!"
 * 
 * @apiError (404: Missing Parameters) {String} message "email not found"
 * 
 * @apiError (400: SQL Error) {String} forgot password error
 * 
 * @apiUse JSONError
 */ 

router.post("/", (req, res, next) => {

    const email = req.body.email
    const updatedPassword = req.body.updatedPassword

    if(isStringProvided(email)) {
        const theQuery = `SELECT saltedhash, salt, Credentials.memberid FROM Credentials
                          INNER JOIN Members ON
                          Credentials.memberid=Members.memberid 
                          WHERE Members.email=$1`
        const values = [email]
        pool.query(theQuery, values)
            .then(result => {
                if (result.rowCount == 0) {
                    res.status(404).send({
                        message: "User Information not found",
                        address: email
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
    let newPassword = Math.random().toString(20).substring(7, 15)
    let saltedhash = generateHash(newPassword,salt);

    const theQuery = 'UPDATE Credentials SET saltedhash= $1, salt= $2 WHERE MemberID = $3'
    const values = [saltedhash, salt, req.memberid]


    pool.query(theQuery, values)
    .then(result => {
        const email = req.body.email
        res.status(201).send({
            success: true,
            message: "New password created",
            newpass: newPassword
        })
        sendEmail("tcss450chat@gmail.com", email, "Forgot Password", "You have recently requested to reset your password.Your new password is: " + newPassword)
    })
    .catch((error) => {
        //credentials dod not match
        res.status(400).send({
            message: 'Failed' 
        })
    })
})

router.post("/reset", (req, res, next) => {

    const email = req.body.email
    req.updatedPassword = req.body.updatedPassword
    const code = req.body.code

    console.log(req.body)

    if(isStringProvided(email)) {
        const theQuery = `SELECT saltedhash, salt, Credentials.memberid FROM Credentials
                          INNER JOIN Members ON
                          Credentials.memberid=Members.memberid 
                          WHERE Members.email=$1 AND Credentials.temporarypassword=$2`
        const values = [email, code]
        pool.query(theQuery, values)
            .then(result => {
                if (result.rowCount == 0) {
                    res.status(404).send({
                        message: "User Information not found",
                        address: email
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
    //let newPassword = Math.random().toString(20).substring(7, 15)
    let saltedhash = generateHash(req.updatedPassword,salt);

    const theQuery = 'UPDATE Credentials SET saltedhash= $1, salt= $2, temporarypassword = NULL WHERE MemberID = $3'
    const values = [saltedhash, salt, req.memberid]


    pool.query(theQuery, values)
    .then(result => {
        const email = req.body.email
        res.status(201).send({
            success: true,
            message: "New password created",
        })
        sendEmail("tcss450chat@gmail.com", email, "You password was updated", "You have recently updated your password. If you did not do this, please reset your password.")
    })
    .catch((error) => {
        //credentials dod not match
        res.status(400).send({
            message: 'Failed' 
        })
    })
})

router.get("/reset", (req, res, next) => {

    const email = req.body.email

    if(isStringProvided(email)) {
        const theQuery = `SELECT saltedhash, salt, Credentials.memberid FROM Credentials
                          INNER JOIN Members ON
                          Credentials.memberid=Members.memberid 
                          WHERE Members.email=$1`
        const values = [email]
        pool.query(theQuery, values)
            .then(result => {
                if (result.rowCount == 0) {
                    res.status(404).send({
                        message: "User Information not found",
                        address: email
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

    //let salt = generateSalt(32)
    let newPassword = Math.random().toString(20).substring(7, 15)
    //let saltedhash = generateHash(newPassword,salt);

    const theQuery = 'UPDATE Credentials SET temporarypassword=$1 WHERE MemberID = $2'
    const values = [newPassword, req.memberid]


    pool.query(theQuery, values)
    .then(result => {
        const email = req.body.email
        res.status(201).send({
            success: true,
            message: "New password created",
            newpass: newPassword
        })
        sendEmail("tcss450chat@gmail.com", email, "Forgot Password", 'You have recently requested to reset your password. Use this link to reset your password: <a href="https://tcss450-weather-chat.herokuapp.com/forgotpassword/reset/">Update password</a>' + email +"/"+ newPassword)
    })
    .catch((error) => {
        //credentials dod not match
        res.status(400).send({
            message: 'Failed' 
        })
    })
})

//Get the form to update password
router.get("/reset/:email/:code", (req, res, next) => {

    const code = req.params.code
    const email = req.params.email

    if(isStringProvided(email)) {
        const theQuery = "SELECT saltedhash, salt, temporarypassword, Credentials.memberid FROM Credentials INNER JOIN Members ON Credentials.memberid=Members.memberid WHERE Members.email=$1 AND Credentials.temporarypassword=$2"
        const values = [email, code]
        pool.query(theQuery, values)
            .then(result => {
                if (result.rowCount == 0) {
                    res.status(404).send({
                        message: "User Information not found",
                        address: email
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

    //let salt = generateSalt(32)
    //let newPassword = Math.random().toString(20).substring(7, 15)
    //let saltedhash = generateHash(newPassword,salt);

    //const theQuery = 'UPDATE Credentials SET saltedhash= $1, salt= $2 WHERE MemberID = $3'
    //const values = [saltedhash, salt, req.memberid]
    //res.send("Hello")
    res.render('resetpassword.ejs', {email: req.params.email, code: req.params.code});
    // pool.query(theQuery, values)
    // .then(result => {
    //     const email = req.params.email
    //     res.status(201).send({
    //         success: true,
    //         message: "New password created",
    //         newpass: newPassword
    //     })
    //     sendEmail("tcss450chat@gmail.com", email, "Forgot Password", "You have recently requested to reset your password.Your new password is: " + newPassword)
    // })
    // .catch((error) => {
    //     //credentials dod not match
    //     res.status(400).send({
    //         message: 'Failed' 
    //     })
    // })
})


module.exports = router
