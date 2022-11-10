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
router.get('/', function(req, res, next){

        res.status(200).send('Pong!' + req.decoded) 
    
})

module.exports = router 