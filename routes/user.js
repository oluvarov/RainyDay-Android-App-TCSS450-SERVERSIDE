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
 * @apiName updateName
 * @apiGroup update
 * @apiParam fistname, lastname
 * 
 * @apiSuccess {boolean} success true when the email is found and code matched.
 * @apiSuccess {json} message {success: true}
 * 
 *  * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *       {success: true}
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
        res.status(200).send({
            success: true
        })
    })
    .catch((error) => {
        console.log("Member update")
        console.log(error)
    })
  })

router.post('/update/password', (req, res, next) => {

    if (!isStringProvided(req.header("oldPassword")) || !isStringProvided(req.header("newPassword"))) {
        res.status(400).send('Missing Information')
        return
    } else 
     if(req.header("oldPassword") === req.header("newPassword")){
        res.status(400).send('Bad request: old password cannot be the same as new ')
        return
    } else {
        req.memberid = req.decoded.memberid;
        req.oldPassword = req.header("oldPassword")
        req.newPassword = req.header("newPassword")
        next();
    }

    
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

    theQuery = 'SELECT memberid, username, firstname, lastname FROM MEMBERS WHERE memberid = $1'
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
                        username: result.rows[0].username,
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