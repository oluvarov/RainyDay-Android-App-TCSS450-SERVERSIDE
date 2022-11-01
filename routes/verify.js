//express is the framework we're going to use to handle requests
const { response } = require('express')
const { request } = require('express')
const express = require('express')
const pool = require('../utilities').pool

//Access the connection to Heroku Database
//const pool = require('../utilities').pool

//const validation = require('../utilities').validation
//let isStringProvided = validation.isStringProvided

//const generateHash = require('../utilities').generateHash
//const generateSalt = require('../utilities').generateSalt

//const sendEmail = require('../utilities').sendEmail

const url = require('url');
const querystring = require('querystring');
const { nextTick } = require('process');

const router = express.Router()



router.get('/', function(req, res, next){
    const code = req.query.code;
    
    const theQuery = 'SELECT MemberID, Email, Verification FROM MEMBERS WHERE Verification = $1'
    const values = [code]

    pool.query(theQuery, values)
            .then(result => {

                if (result.rowCount == 0) {
                    res.status(404).send('<h3>🚫Verification code is invalid, or email was already verified.</h3>')
                    return
                } else {
                    req.memberid = result.rows[0].memberid
                    req.code = code
                    next()
                }   
                
            })
  }, (req, res) => {
    console.log(req.memberid)
    console.log(req.code)
    const theQuery = 'UPDATE MEMBERS SET Verification = $2 WHERE MemberID = $1'
    const values = [req.memberid, 1]
    pool.query(theQuery, values)
    res.send('✅Your email was successfully verified!' + req.query.code);
  });



module.exports = router