//express is the framework we're going to use to handle requests
const { response } = require('express')
const { request } = require('express')
const express = require('express') 
const pool = require('../utilities/exports').pool

const url = require('url');
const querystring = require('querystring');
const { nextTick } = require('process');
const e = require('express');
const { checkPassword, isValidPassword } = require('../utilities/validationUtils');

const generateHash = require('../utilities').generateHash
const generateSalt = require('../utilities').generateSalt

const sendEmail = require('../utilities').sendEmail

const validation = require('../utilities').validation
let isStringProvided = validation.isStringProvided

const router = express.Router()

/**
 * @api {post} /forgotpassword/reset Request to reset password
 * @apiName PostResetPassword
 * @apiGroup forgotpassword
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * @apiParam {String} email of user
 * @apiParam {String} code of user
 * 
 * @apiSuccess (Success 201) {boolean} success true when the new password is created
 * @apiSuccess (Success 201) {String} message "New password created"
 * 
 * @apiSuccessExample {json} Success-Response:
 *    HTTP/1.1 201 OK
 *   {
 *     "success": true,
 *    "message": "New password created"
 *  }
 * 
 * 
 * @apiError (404: Not Found) {String} message "User Information not found"
 * 
 * @apiError (400: SQL Error) {String} message "Failed"
 * 
 * 
 * @apiUse JSONError
 */ 

router.post("/reset", (req, res, next) => {

    const email = req.body.email
    req.updatedPassword = req.body.updatedPassword
    updatedPassword = req.updatedPassword
    const code = req.body.code
    if (!isValidPassword(updatedPassword)) {
        res.status(400).send({
            message: "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"
        })
        return
    }

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
    let saltedhash = generateHash(req.updatedPassword,salt);

    const theQuery = 'UPDATE Credentials SET saltedhash= $1, salt= $2, temporarypassword = NULL WHERE MemberID = $3'
    const values = [saltedhash, salt, req.memberid]


    pool.query(theQuery, values)
    .then(result => {
        const email = req.body.email
        res.status(201).send({
            success: true,
            message: "New password created for 🌦️RainyDay",
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

/**
 * @api {get} /forgotpassword/reset Request to get reset password email
 * @apiName GetResetPasswordEmail
 * @apiGroup forgotpassword
 * 
 * @apiHeader {String} email of user
 * 
 * @apiSuccess (Success 201) {boolean} success true when the new password is created
 * @apiSuccess (Success 201) {String} message "Password reset email sent"
 * 
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 201 OK
 *  {
 *   "success": true,
 *  "message": "Password reset email sent"
 *   }
 * 
 * 
 * @apiError (404: Not Found) {String} message "User Information not found"
 * @apiError (400: SQL Error) {String} message "Failed"
 */

router.get("/reset", (req, res, next) => {

    const email = req.headers.email

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
                    req.email = req.headers.email
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
        res.status(201).send({
            success: true,
            message: "Password reset link sent to email"
        })
        sendEmail("tcss450chat@gmail.com", req.email, "Password Reset Link for 🌦️RainyDay", 'You have recently requested to reset your password. Use this link to reset your password: <a href="https://tcss450-weather-chat.herokuapp.com/forgotpassword/reset/' + req.email +"/"+ newPassword + '">Reset Password</a>')
    })
    .catch((error) => {
        //credentials dod not match
        res.status(400).send({
            message: 'Failed' 
        })
    })
})

//Get the form to update password

/**
 * @api {get} /forgotpassword/reset/:email/:code Request to get reset password form
 * @apiName GetResetPasswordForm
 * @apiGroup forgotpassword
 * 
 * @apiParam {String} email of user
 * @apiParam {String} code of user
 * 
 * @apiSuccess (Success 200) {html} render the reset password form
 * 
 * @apiSuccessExample {html} Success-Response:
 *  HTTP/1.1 200 OK
 * <html></html>
 * 
 * @apiError (404: Not Found) {String} message "User Information not found"
 */
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

    res.render('resetpassword.ejs', {email: req.params.email, code: req.params.code});
})


module.exports = router
