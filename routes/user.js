//express is the framework we're going to use to handle requests
const { response } = require('express')
const { request } = require('express')
const express = require('express') 
const pool = require('../utilities/exports').pool

const url = require('url');
const querystring = require('querystring');
const { nextTick } = require('process');

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



router.get('/', function(req, res){

    const memberid = req.decoded.memberid;


    theQuery = 'SELECT MemberID, firstname, lastname FROM MEMBERS WHERE memberid = $1'
    const values = [memberid]

    pool.query(theQuery, values)
            .then(result => { 

                if (result.rowCount == 0) {
                    res.status(404).send('invalid input')
                    return
                } else {
                    res.json({
                        success: true,
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