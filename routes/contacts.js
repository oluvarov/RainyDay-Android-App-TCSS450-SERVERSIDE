//express is the framework we're going to use to handle requests
const { response } = require('express')
const { request } = require('express')
const express = require('express') 
const pool = require('../utilities').pool
const validation = require('../utilities').validation

const url = require('url');
const querystring = require('querystring');
const { nextTick } = require('process');

const router = express.Router()


/**
 * @api {get} /list Request to list contacts
 * @apiName getList
 * @apiGroup Contacts
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * @apiParam {Number} memberid_a memberid of user
 * 
 * @apiSuccess (200: Success) {JSON} contacts json array
 * 
 * @apiError (400: Bad Request) {String} message "🚫Bad request!"
 * 
 * @apiError (404: Missing Parameters) {String} message "Contacts not found"
 * 
 * @apiError (400: SQL Error) {String} message contacts getting error
 * 
 * @apiUse JSONError
 */ 
router.get('/list', function(req, res, next){
    const memberid_a = req.headers.memberid_a;
    if (memberid_a.length < 1) {
        res.status(400).send('🚫Bad request!') 
    }
    
    const theQuery = 'SELECT memberid,username,firstname,lastname,contacts.verified FROM contacts INNER JOIN Members ON contacts.memberid_b = members.memberid WHERE memberid_a=$1 AND verified=$2'
    const values = [memberid_a,1]

    pool.query(theQuery, values)
            .then(result => { 

                if (result.rowCount == 0) {
                    req.contacts = 0
                    next()
                } else {
                    const contacts = JSON.stringify(Object.assign({}, result.rows))
                    req.contacts = contacts
                    req.memberid = memberid_a
                    next()
                }   

            })
            .catch((error) => {
                console.log("contacts geting error")
                console.log(error)
            })
  }, (req, res, next) => {
    const theQuery = 'SELECT memberid,username,firstname,lastname,contacts.verified FROM contacts INNER JOIN Members ON contacts.memberid_a = members.memberid WHERE memberid_b=$1 AND verified=$2'
    const values = [req.memberid,0]

    pool.query(theQuery, values)
            .then(result => { 

                if (result.rowCount == 0) {
                    req.incoming_requests = 0
                    next()
                } else {
                    const contacts = JSON.stringify(Object.assign({}, result.rows))
                    req.incoming_requests = contacts
                    next()
                    //console.log(req.incoming_requests)
                    //res.send(req.contacts + "," + req.incoming_requests)
                }   

            })
            .catch((error) => {
                console.log("contacts geting error")
                console.log(error)
            })

  }, (req, res) => {
    const theQuery = 'SELECT memberid,username,firstname,lastname,contacts.verified FROM contacts INNER JOIN Members ON contacts.memberid_b = members.memberid WHERE memberid_a=$1 AND verified=$2'
    const values = [req.memberid,0]

    pool.query(theQuery, values)
            .then(result => { 

                if (result.rowCount == 0 && req.contacts == 0 && req.incoming_requests == 0) {
                    res.status(404).send('No entries found')
                    return
                } else {
                    const contacts = JSON.stringify(Object.assign({}, result.rows))
                    req.outgoing_requests = contacts
                    res.send('{"friends":' + req.contacts + ',"incoming_requests":' + req.incoming_requests + ',"outgoing_requests":' + req.outgoing_requests + '}')
                }   

            })
            .catch((error) => {
                console.log("contacts geting error")
                console.log(error)
            })

  })

//send friend request
//TODO: APIDOC
router.post('/request', function(req, res, next) {
    //get user info by email
    const email = req.headers.email;

    theQuery = 'SELECT memberid, username, firstname, lastname, email FROM MEMBERS WHERE email = $1'
    const values = [email]

    pool.query(theQuery, values)
            .then(result => { 
                if (result.rowCount == 0) {
                    res.status(404).send('invalid input, error 22')
                    return
                } else {
                        req.memberid_a = req.decoded.memberid
                        req.memberid_b = result.rows[0].memberid
                        req.username = result.rows[0].username
                        req.firstname = result.rows[0].firstname
                        req.lastname = result.rows[0].lastname
                        req.email = result.rows[0].email
                        req.user = result.rows
                        console.log("found user")
                        next();
                }   
                
            })
            .catch((error) => {
                console.log("member lookup error")
                console.log(error)
            })
}, (req,res,next) =>{

    //check if request exists in db already
    theQuery = 'SELECT memberid_a, memberid_b, verified FROM CONTACTS WHERE memberid_a = $1 AND memberid_b = $2'
    const values = [req.memberid_a, req.memberid_b]

    pool.query(theQuery, values)
            .then(result => { 
                if (result.rowCount == 0) {
                    console.log("no duplicates")
                    next();
                } else {
                        res.status(409).send('Friends request already exist!')
                        return
                }   
                
            })
            .catch((error) => {
                console.log("member lookup error")
                console.log(error)
            })

},
 (req, res) => {
    //add request to db
    let theQuery = "INSERT INTO CONTACTS(memberid_a, memberid_b, verified) VALUES ($1, $2, $3) RETURNING memberid_a, memberid_b, verified"
    const values = [req.memberid_a,req.memberid_b, 0]

    pool.query(theQuery, values)
            .then(result => { 
                if (result.rowCount == 0) {
                    res.status(404).send('invalid input, error 22')
                    return
                } else {
                        req.request = result.rows
                        console.log("added friend request")
                        res.status(200).send({
                            success: true,
                            memberid_a: req.memberid_a,
                            memberid_b: req.memberid_b,
                            verified: 0
                        })
                }   
                
            })
            .catch((error) => {
                console.log("contact insert error")
                console.log(error)
            })

})

router.get('/request', function(req, res) {
    //get user info by email
    const memberid_b = req.headers.memberid_b;
    const memberid_a = req.decoded.memberid;

   //check if request exists in db already
   theQuery = 'SELECT memberid_a, memberid_b, verified FROM CONTACTS WHERE memberid_a = $1 AND memberid_b = $2'
   const values = [memberid_a, memberid_b]

   pool.query(theQuery, values)
           .then(result => { 
               if (result.rowCount == 0) {
                    res.status(404).send({
                        success: false,
                        message: 'Request not found'
                    })
                    return
               } else {
                res.status(200).send({
                    success: true,
                    memberid_a: result.rows[0].memberid_a,
                    memberid_b: result.rows[0].memberid_b,
                    verified: result.rows[0].verified
                })
               }   
               
           })
           .catch((error) => {
               console.log("request lookup error")
               console.log(error)
           })
})

router.patch('/request', function(req, res, next) {
    //get user info by email
    const memberid_b = req.headers.memberid_b;
    const memberid_a = req.decoded.memberid;
    const verified = req.headers.verified;

   //check if request exists in db already
   theQuery = 'SELECT memberid_a, memberid_b, verified FROM CONTACTS WHERE memberid_a = $2 AND memberid_b = $1'
   const values = [memberid_a, memberid_b]

   pool.query(theQuery, values)
           .then(result => { 
               if (result.rowCount == 0) {
                    res.status(404).send({
                        success: false,
                        message: 'Request not found'
                    })
                    return
               } else if (verified === result.rows[0].verified) {
                res.status(400).send({
                    success: false,
                    message: 'Nothing to update'
                })
               } else if (verified === '1') {
                req.memberid_a = req.decoded.memberid
                req.memberid_b = req.headers.memberid_b
                req.verified = verified
                next()
               } else {
                res.status(400).send({
                    success: false,
                    message: 'Invalid input'
                })
               }
               
           })
           .catch((error) => {
               console.log("request lookup error")
               console.log(error)
           })
}, (req,res,next) => {
    const theQuery = 'UPDATE Contacts SET verified= $3 WHERE memberid_a = $2 AND memberid_b = $1'
    const values = [req.memberid_a,req.memberid_b,req.verified]

    pool.query(theQuery, values)
           .then(result => { 
               if (result.rowCount == 0) {
                    res.status(404).send({
                        success: false,
                        message: 'Nothing to update 2'
                    })
                    return
               } else {
                next();
               }
               
           })
           .catch((error) => {
               console.log("request lookup error")
               console.log(error)
           })
}, (req,res,next) => {

    
    let theQuery = "INSERT INTO CONTACTS(memberid_a, memberid_b, verified) VALUES ($1, $2, $3) RETURNING memberid_a, memberid_b, verified"
    const values = [req.memberid_a, req.memberid_b, req.verified]

    pool.query(theQuery, values)
           .then(result => { 
               if (result.rowCount == 0) {
                    res.status(404).send({
                        success: false,
                        message: 'Error 50',
                        db: result.rows
                    })
                    return
               } else {
                res.status(200).send({
                    success: true,
                    message: 'Request accepted, new entry member_b->member_a created'
                })
                return
               }
               
           })
           .catch((error) => {
               console.log("request lookup error")
               console.log(error)
           })


})
//deleting friend request
router.delete('/request', function(req, res, next) {
    const memberid_b = req.headers.memberid_b;
    const memberid_a = req.decoded.memberid;
    let theQuery = "DELETE FROM CONTACTS WHERE memberid_a = $1 AND memberid_b = $2"
    const values = [memberid_a, memberid_b]

    pool.query(theQuery, values)
           .then(result => { 
               if (result.rowCount == 0) {
                    res.status(404).send({
                        success: false,
                        message: 'Nothing to delete'
                    })
                    return
               } else {
                console.log("first entry deleted, going to the second..")
                req.memberid_a = memberid_a
                req.memberid_b = memberid_b
                next()
               }
               
           })
           .catch((error) => {
               console.log("1st entry friend delete error")
               console.log(error)
           })

}, (req,res) => {
    let theQuery = "DELETE FROM CONTACTS WHERE memberid_a = $2 AND memberid_b = $1"
    const values = [req.memberid_a, req.memberid_b]

    pool.query(theQuery, values)
           .then(result => { 
               if (result.rowCount == 0) {
                    res.status(200).send({
                        success: true,
                        message: '1st entry deleted, second failed(not found)'
                    })
                    return
               } else {
                console.log("second entry deleted")
                res.status(200).send({
                    success: true,
                    message: 'Friend deleted.'
                })
               }
               
           })
           .catch((error) => {
               console.log("friend delete error")
               console.log(error)
           })
})
//find contact by email
router.get('/', function(req, res, next) {
    //get user info by email
    const email = req.headers.email;

    theQuery = 'SELECT memberid, username, firstname, lastname, email FROM MEMBERS WHERE email = $1'
    const values = [email]

    pool.query(theQuery, values)
            .then(result => { 
                if (result.rowCount == 0) {
                    res.status(404).send({
                        success: false,
                        message: "user not found"
                    })
                    return
                } else {
                        console.log("found contact")
                        res.status(200).send({
                            success: true,
                            memberid_b: result.rows[0].memberid,
                            username: result.rows[0].username,
                            firstname: result.rows[0].firstname,
                            lastname: result.rows[0].lastname,
                            email: result.rows[0].email
                        })
                }   
                
            })
            .catch((error) => {
                console.log("contact lookup error")
                console.log(error)
            })
})

module.exports = router 