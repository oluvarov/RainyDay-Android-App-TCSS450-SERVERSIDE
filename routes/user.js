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
 * @api {get} /user/update/name/ request to update name
 * @apiName getEmailVerification
 * @apiGroup Verification 
 * @apiParam code
 * 
 * @apiSuccess {boolean} success true when the email is found and code matched.
 * @apiSuccess {String} message "✅Your email was successfully verified!"
 * 
 *  * @apiSuccessExample {html} Success-Response:
 *     HTTP/1.1 200 OK
 *       <h3>✅Your email was successfully verified!</h3>
 * 
 * @apiError (404: User Not Found) {String} message "User not found"
 * 
 */ 
router.post('/update/name', function(req, res, next){

    const memberid = req.decoded.memberid;
    const firstname = req.headers.firstname;
    const lastname = req.headers.lastname;

    if (firstname.length == 0 || lastname.length == 0) {
        res.status(400).send('bad request')
        return
    }

    theQuery = 'SELECT MemberID, firstname, lastname FROM MEMBERS WHERE memberid = $1'
    const values = [memberid]

    pool.query(theQuery, values)
            .then(result => { 

                if (result.rowCount == 0) {
                    res.status(404).send('invalid input')
                    return
                } else {
                    if (result.rows[0].firstname == firstname && result.rows[0].lastname == lastname) {
                        res.status(400).send('bad request')
                        return
                    }
                    req.memberid = result.rows[0].memberid
                    req.firstname = firstname;
                    req.lastname = lastname;
                    next()
                }   
                
            })
            .catch((error) => {
                console.log("member lookup")
                console.log(error)
            })
  }, (req, res) => {
    const theQuery = 'UPDATE MEMBERS SET firstname = $1, lastname = $2 WHERE MemberID = $3'
    const values = [req.firstname,req.lastname,req.memberid]
    pool.query(theQuery, values)
    .then(result => {
        res.status(200).send('✅')
    })
    .catch((error) => {
        console.log("Member update")
        console.log(error)
    })
  })

// router.post('/update/password', (req, res, next) => {


//     if (isStringProvided(req.headers.oldPassword) || isStringProvided(req.headers.newPassword)) {
//         res.status(400).send('bad request')
//         return
//     } else {
//         req.memberid = req.decoded.memberid;
//         req.oldPassword = req.headers.oldPassword;
//         req.newPassword = req.headers.newPassword;
//         next();
//     }

//   }, (req,res,next) => {
//     const memberid = req.memberid;
//     const oldPassword = req.oldPassword;
//     const newPassword = req.newPassword;

//     const theQuery = `SELECT saltedhash, salt, Credentials.memberid FROM Credentials
//                       INNER JOIN Members ON
//                       Credentials.memberid=Members.memberid 
//                       WHERE Members.memberid=$1`
//     const values = [memberid]
//     pool.query(theQuery, values)
//         .then(result => {
//             if (result.rowCount == 0) {
//                 response.status(404).send({
//                     message: 'User not found' 
//                 })
//                 return
//             }

//             //Retrieve the salt used to create the salted-hash provided from the DB
//             let salt = result.rows[0].salt
            
//             //Retrieve the salted-hash password provided from the DB
//             let storedSaltedHash = result.rows[0].saltedhash 

//             //Generate a hash based on the stored salt and the provided password
//             let providedSaltedHash = generateHash(oldPassword, salt)

//             if (storedSaltedHash === providedSaltedHash) {
//                 next();
//             }
//         })
//   }, (req,res,next) => {
//     newPassword = req.newPassword;
//     memberid = req.memberid;

//     let salt = generateSalt(32)
//     let salted_hash = generateHash(newPassword, salt)

//     const theQuery = 'UPDATE CREDENTIALS SET saltedhash = $1, salt = $2 WHERE MemberID = $3'
//     let values = [salted_hash, salt, memberid]

//     pool.query(theQuery, values)
//         .then(result => {
//             //We successfully added the user!
//             response.status(201).send({
//                 success: true
//             })
//             //sendEmail("tcss450chat@gmail.com", request.body.email, "Welcome to our App! ", 'Please, use link below to verify your email. \n https://tcss450-weather-chat.herokuapp.com/verification/?code=' + request.uniqueCode)
//         })

//   })


router.post('/update/password', (req, res, next) => {

    if (isStringProvided(req.headers.oldPassword) || isStringProvided(req.headers.newPassword)) {
        res.status(400).send('bad request')
        return
    } else {
        req.memberid = req.decoded.memberid;
        req.oldPassword = req.header("oldPassword")
        req.newPassword = req.header("newPassword")
        next();
    }

    // else if(req.headers.oldPassword === req.headers.newPassword){
    //     res.status(400).send('bad request: old password cannot be the same as new')
    //     return
    
  }, (req, res, next) => {
    const memberid = req.memberid;
    //const oldPassword = req.oldPassword;
    //const newPassword = req.newPassword;

    const theQuery = `SELECT saltedhash, salt, Credentials.memberid FROM Credentials
                      INNER JOIN Members ON
                      Credentials.memberid=Members.memberid 
                      WHERE Members.memberid=$1`
    const values = [memberid]
    pool.query(theQuery, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: 'User not found' 
                })
                return
            }
            //res.status(200).send('pong' + result.rows[0].salt +"   " + result.rows[0].memberid + " " + req.oldPassword + " " + oldPassword)
            //Retrieve the salt used to create the salted-hash provided from the DB
            let salt = result.rows[0].salt
            
            //Retrieve the salted-hash password provided from the DB
            let storedSaltedHash = result.rows[0].saltedhash

            //Generate a hash based on the stored salt and the provided password
            let providedSaltedHash = generateHash(req.oldPassword, salt)

            
            // res.status(200).send({
            //     oldPas: req.oldPassword,
            //     oldpashe: req.headers.oldPassword,
            //     memid: result.rows[0].memberid,
            //     stsalthash: storedSaltedHash,
            //     provsalthash: providedSaltedHash,
            //     sal: salt
            // })

            if (storedSaltedHash === providedSaltedHash) {
                next();
            } else {
                res.status(400).send('Bad request')
            }
        })
  }, (req, res) => {
    newPassword = req.newPassword;
    memberid = req.memberid;

    //res.status(200).send('pong_last' + newPassword + " mem: " + memberid)

    let salt = generateSalt(32)
    let salted_hash = generateHash(newPassword, salt)

    const theQuery = 'UPDATE CREDENTIALS SET saltedhash = $1, salt = $2 WHERE MemberID = $3'
    const values = [salted_hash, salt, memberid]

    pool.query(theQuery, values)
        .then(result => {
            //We successfully added the user!
            res.status(200).send({
                success: true
            })
        })
        .catch((error) => {
            //log the error for debugging
             console.log("PWD insert on password change")
             console.log(error)

            res.status(400).send({
                message: "error_03, see detail",
                detail: error.detail
            })
        })
  })

router.get('/', function(req, res){

    const memberid = req.decoded.memberid;

    theQuery = 'SELECT memberid, firstname, lastname FROM MEMBERS WHERE memberid = $1'
    const values = [memberid]

    pool.query(theQuery, values)
            .then(result => { 
                if (result.rowCount == 0) {
                    res.status(404).send('invalid input')
                    return
                } else {
                    res.json({
                        success: true,
                        memberid: result.rows[0].memberid,
                        firstname: result.rows[0].firstname,
                        lastname: result.rows[0].lastname
                    })
                }   
                
            })
            .catch((error) => {
                console.log("member lookup")
                console.log(error)
            })
  })    


module.exports = router 