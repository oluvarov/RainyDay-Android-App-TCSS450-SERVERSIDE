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

router.get("/", (req, res, next) => {

    const email = req.body.email

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
    let newPassword = Math.random().toString(20).substring(7, 15)
    let saltedhash = generateHash(newPassword,salt);

    const theQuery = 'UPDATE Credentials SET saltedhash= $1, salt= $2 WHERE MemberID = $3'
    const values = [saltedhash, salt, req.memberid]


    pool.query(theQuery, values)
    .then(result => {
        const email = req.body.email
        res.json({
            success: true,
            message: "New password created",
            newpass: newPassword
        })
    })
    .catch((error) => {
        //credentials dod not match
        res.status(400).send({
            message: 'Failed' 
        })
    })
})


module.exports = router
