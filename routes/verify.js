//express is the framework we're going to use to handle requests
const { response } = require('express')
const { request } = require('express')
const express = require('express') 
const pool = require('../utilities').pool

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
            .catch((error) => {
                console.log("member verification")
                console.log(error)

            })
  }, (req, res) => {
    const theQuery = 'UPDATE MEMBERS SET Verification = $2 WHERE MemberID = $1'
    const values = [req.memberid, 1]
    pool.query(theQuery, values)
    .then(result => {
        res.status(200).send('✅Your email was successfully verified!') 
    })
    .catch((error) => {
        console.log("Member update")
        console.log(error)
    })
  })

  router.get('/status', function(req, res){
    const email = req.body.email;
    
    const theQuery = 'SELECT Email, Verification FROM MEMBERS WHERE email = $1'
    const values = [email]

    pool.query(theQuery, values)  
            .then(result => {

                if (result.rowCount == 0) {
                    res.status(404).send({
                        message: 'User not found' 
                    })
                    return
                } else if (result.rows[0].verification == 1){
                    res.status(200).send({
                        message: 'Verified' 
                    })
                    return
                } else if (result.rows[0].verification != 1){
                    res.status(400).send({
                        message: 'Email is not verified' 
                    })
                    return
                }  
                
            })
            .catch((error) => {
                console.log("Error on SELECT")
                console.log(error)
                console.log("************************")
                console.log(err.stack)
                response.status(400).send({
                message: error.detail
            })
            })
  });

module.exports = router 