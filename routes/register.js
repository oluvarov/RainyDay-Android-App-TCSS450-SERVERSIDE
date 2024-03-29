//express is the framework we're going to use to handle requests
const { response } = require('express')
const { request } = require('express')
const express = require('express')
const { isValidPassword, isValidEmail } = require('../utilities/validationUtils')

//Access the connection to Heroku Database
const pool = require('../utilities').pool

const validation = require('../utilities').validation
let isStringProvided = validation.isStringProvided

const generateHash = require('../utilities').generateHash
const generateSalt = require('../utilities').generateSalt

const sendEmail = require('../utilities').sendEmail

const router = express.Router()

/**
 * @api {post} /auth Request to register a user
 * @apiName PostAuth
 * @apiGroup Auth
 * 
 * @apiParam {String} first a users first name
 * @apiParam {String} last a users last name
 * @apiParam {String} email a users email *unique
 * @apiParam {String} password a users password
 * @apiParam {String} [username] a username *unique, if none provided, email will be used
 * 
 * @apiParamExample {json} Request-Body-Example:
 *  {
 *      "first":"Charles",
 *      "last":"Bryan",
 *      "email":"cfb3@fake.email",
 *      "password":"test12345"
 *  }
 * 
 * @apiSuccess (Success 201) {boolean} success true when the name is inserted
 * @apiSuccess (Success 201) {String} email the email of the user inserted 
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: Username exists) {String} message "Username exists"
 * 
 * @apiError (400: Email exists) {String} message "Email exists"
 *  
 * @apiError (400: Other Error) {String} message "other error, see detail"
 * @apiError (400: Other Error) {String} detail Information about th error
 * 
 */ 
 router.post('/', (request, response, next) => {

    //Retrieve data from query params
    const first = request.body.first
    const last = request.body.last
    const username = isStringProvided(request.body.username) ?  request.body.username : request.body.email
    const email = request.body.email
    const password = request.body.password

    function getRandomNumber(digit) {
        return Math.random().toFixed(digit).split('.')[1];
      }

    const uniqueCode = getRandomNumber(8);
    
    //Verify that the caller supplied all the parameters
    //In js, empty strings or null values evaluate to false
    if(isStringProvided(first) 
        && isStringProvided(last) 
        && isStringProvided(username) 
        && isStringProvided(email) 
        && isStringProvided(password)) {

            if (!isValidPassword(password) || ! isValidEmail(email)){
                response.status(400).send({
                    message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character. Email must be valid email format (ex: John123@gmail.com)."
                })
                return
            }
        
        //We're using placeholders ($1, $2, $3) in the SQL query string to avoid SQL Injection
        //If you want to read more: https://stackoverflow.com/a/8265319
        let theQuery = "INSERT INTO MEMBERS(FirstName, LastName, Username, Email, Verification) VALUES ($1, $2, $3, $4, $5) RETURNING Email, MemberID"
        let values = [first, last, username, email, uniqueCode]
        pool.query(theQuery, values)
            .then(result => {
                //stash the memberid into the request object to be used in the next function
                request.memberid = result.rows[0].memberid
                request.uniqueCode = uniqueCode
                next()
            })
            .catch((error) => {
                //log the error  for debugging
                 console.log("Member insert")
                 console.log(error)
                if (error.constraint == "members_username_key") {
                    response.status(400).send({
                        message: "Username exists"
                    })
                } else if (error.constraint == "members_email_key") {
                    response.status(400).send({
                        message: "Email exists"
                    })
                } else {
                    response.status(400).send({
                        data: request.body,
                        message: "other error, see detail",
                        detail: error.detail
                    })
                }
            })
    } else {
        response.status(400).send({
            message: "Missing required information"
        })
    }
}, (request, response) => {
        //We're storing salted hashes to make our application more secure
        //If you're interested as to what that is, and why we should use it
        //watch this youtube video: https://www.youtube.com/watch?v=8ZtInClXe1Q
        let salt = generateSalt(32)
        let salted_hash = generateHash(request.body.password, salt)

        let theQuery = "INSERT INTO CREDENTIALS(MemberId, SaltedHash, Salt) VALUES ($1, $2, $3)"
        let values = [request.memberid, salted_hash, salt]
        pool.query(theQuery, values)
            .then(result => {
                //We successfully added the user!
                response.status(201).send({
                    success: true,
                    email: request.body.email
                })
                sendEmail("tcss450chat@gmail.com", request.body.email, "Welcome to our App! ", 'Please, use link below to verify your email. \n https://tcss450-weather-chat.herokuapp.com/verification/?code=' + request.uniqueCode)
            })
            .catch((error) => {

                /***********************************************************************
                 * If we get an error inserting the PWD, we should go back and remove
                 * the user from the member table. We don't want a member in that table
                 * without a PWD! That implementation is up to you if you want to add
                 * that step. 
                 **********************************************************************/

                response.status(400).send({
                    message: "other error, see detail",
                    detail: error.detail
                })
            })
})


module.exports = router