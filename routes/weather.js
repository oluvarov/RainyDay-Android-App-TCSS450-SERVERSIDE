//express is the framework we're going to use to handle requests
const { response } = require('express')
const { request } = require('express')
const express = require('express') 
const pool = require('../utilities').pool
const http = require('http')

const url = require('url');
const querystring = require('querystring');
const { nextTick } = require('process');

const router = express.Router()


/**
 * @api {get} /verification Request to verify email
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
router.get('/current', function(req, res, next){
    const ip = req.headers.ip;
    if (ip.length == 0) {
        res.status(400).send('🚫Bad request!') 
    }

    let url = 'http://ip-api.com/json/'

    http.get(url + ip, response => { //collecting response
        let rawData = ''
        response.on('data', chunk => {
            rawData += chunk
        })
    
        response.on('end', () => {
            const parsedData = JSON.parse(rawData)
            req.zip = parsedData.zip;
            next()
        })
    })
    
  }, (req, res, next) => {

    let url = 'http://api.openweathermap.org/data/2.5/weather?zip=' + req.zip + '&appid=' + process.env.WEATHER_API_KEY + '&units=metric'

    http.get(url, response => {
        let rawData = ''
        response.on('data', chunk => {
            rawData += chunk
        })
    
        response.on('end', () => {
            const parsedData = JSON.parse(rawData);
            req.weather = parsedData
            next()
        })

    })
  }, (req,res) => {
    res.status(200).send(req.weather)
  })

router.get('/forecast', function(req, res, next){
    const ip = req.headers.ip;
    if (ip.length == 0) {
        res.status(400).send('🚫Bad request!') 
    }

    let url = 'http://ip-api.com/json/'

    http.get(url + ip, response => { //collecting response
        let rawData = ''
        response.on('data', chunk => {
            rawData += chunk
        })
    
        response.on('end', () => {
            const parsedData = JSON.parse(rawData)
            req.zip = parsedData.zip;
            next()
        })
    })
    
  }, (req, res, next) => {

    let url = 'http://api.openweathermap.org/data/2.5/forecast?zip=' + req.zip + '&appid=' + process.env.WEATHER_API_KEY + '&cnt=5'

    http.get(url, response => {
        let rawData = ''
        response.on('data', chunk => {
            rawData += chunk
        })
    
        response.on('end', () => {
            const parsedData = JSON.parse(rawData);
            req.weather = parsedData
            next()
        })

    })
  }, (req,res) => {
    res.status(200).send(req.weather)
  })



router.get('/today', function(req, res, next){
    const ip = req.headers.ip;
    if (ip.length == 0) {
        res.status(400).send('🚫Bad request!') 
    }

    let url = 'http://ip-api.com/json/'

    http.get(url + ip, response => { //collecting response
        let rawData = ''
        response.on('data', chunk => {
            rawData += chunk
        })
    
        response.on('end', () => {
            const parsedData = JSON.parse(rawData)
            req.zip = parsedData.zip;
            next()
        })
    })
    
  }, (req, res, next) => {

    let url = 'https://pro.openweathermap.org/data/2.5/forecast/hourly?zip='+ req.zip + '&appid=' + process.env.WEATHER_API_KEY + '&cnt=24'

    http.get(url, response => {
        let rawData = ''
        response.on('data', chunk => {
            rawData += chunk
        })
    
        response.on('end', () => {
            const parsedData = JSON.parse(rawData);
            req.weather = parsedData
            next()
        })

    })
  }, (req,res) => {
    res.status(200).send(req.weather)
  })



module.exports = router 