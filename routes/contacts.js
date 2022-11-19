//express is the framework we're going to use to handle requests
const { response } = require('express')
const { request } = require('express')
const express = require('express') 
const pool = require('../utilities').pool

const url = require('url');
const querystring = require('querystring');
const { nextTick } = require('process');

const router = express.Router()

router.get('/list', function(req, res, next){
    const memberid_a = req.headers.memberid_a;
    if (memberid_a.length < 1) {
        res.status(400).send('🚫Bad request!') 
    }
    
    const theQuery = 'SELECT memberid,username,firstname,lastname,contacts.verified FROM contacts INNER JOIN Members ON contacts.memberid_b = members.memberid WHERE memberid_a=$1'
    const values = [memberid_a]

    pool.query(theQuery, values)
            .then(result => { 

                if (result.rowCount == 0) {
                    res.status(404).send('Contacts not found')
                    return
                } else {
                    req.contacts = result.rows
                    next()
                }   
            })
            .catch((error) => {
                console.log("contacts geting error")
                console.log(error)

            })
  }, (req, res) => {
    res.send(req.contacts)
  })

module.exports = router 