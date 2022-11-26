//express is the framework we're going to use to handle requests
const { response } = require('express')
const { request } = require('express')
const express = require('express') 
const pool = require('../utilities').pool
const http = require('http')
const https = require('https')

const url = require('url');
const querystring = require('querystring');
const { nextTick } = require('process');

const router = express.Router()


/**
 * @api {get} /current
 * @apiName getCurrentWeather
 * @apiGroup Weather
 * @apiParam ip
 * @apiParam zip
 * @apiParam lat
 * @apiParam lon
 * 
 * @apiSuccess {json} success when weather received from externalapi
 * 
 * 
 * @apiError (404: bad request) {String} bad request
 * 
 */ 
router.get('/current', function(req, res, next){
    if (req.headers.ip) {
        const ip = req.headers.ip;
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
    } else if (req.headers.lat && req.headers.lon){
        req.lat = req.headers.lat
        req.lon = req.headers.lon
        next()
    } else if (req.headers.zip) {
        req.zip = req.headers.zip
        next()
    } else {
        res.status(400).send('🚫Bad request!') 
    }
    
    
  }, (req, res, next) => {

    if (req.zip) {
        var querry = "zip=" + req.zip
    } else if (req.lat && req.lon) {
        querry = "lat=" + req.lat + "&lon=" + req.lon
    } else {
        res.status(400).send('🚫Bad request!') 
    }

    let url = 'http://api.openweathermap.org/data/2.5/weather?' + querry + '&appid=' + process.env.WEATHER_API_KEY + '&units=metric'

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

  /**
 * @api {get} /forecast
 * @apiName getForecast
 * @apiGroup Weather
 * @apiParam ip
 * @apiParam zip
 * @apiParam lat
 * @apiParam lon
 * @apiSuccess {json} success when weather received from externalapi
 * 
 * 
 * @apiError (404: bad request) {String} bad request
 * 
 */ 
router.get('/forecast', function(req, res, next){
    if (req.headers.ip) {
        const ip = req.headers.ip;
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
    } else if (req.headers.lat && req.headers.lon){
        req.lat = req.headers.lat
        req.lon = req.headers.lon
        next()
    } else if (req.headers.zip) {
        req.zip = req.headers.zip
        next()
    } else {
        res.status(400).send('🚫Bad request!') 
    }
    
  }, (req, res, next) => {

    if (req.zip) {
        var querry = "zip=" + req.zip
    } else if (req.lat && req.lon) {
        querry = "lat=" + req.lat + "&lon=" + req.lon
    } else {
        res.status(400).send('🚫Bad request!') 
    }

    let url = 'http://api.openweathermap.org/data/2.5/forecast?' + querry + '&appid=' + process.env.WEATHER_API_KEY + '&cnt=40&units=metric'

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

/**
 * @api {get} /today
 * @apiName getTodaysWeather
 * @apiGroup Weather
 * @apiParam ip
 * @apiParam zip
 * @apiParam lat
 * @apiParam lon
 * 
 * @apiSuccess {json} success when weather received from externalapi
 * 
 * 
 * @apiError (404: bad request) {String} bad request
 * 
 */ 

router.get('/today', function(req, res, next){
    if (req.headers.ip) {
        const ip = req.headers.ip;
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
    } else if (req.headers.lat && req.headers.lon){
        req.lat = req.headers.lat
        req.lon = req.headers.lon
        next()
    } else if (req.headers.zip) {
        req.zip = req.headers.zip
        next()
    } else {
        res.status(400).send('🚫Bad request!') 
    }
    
  }, (req, res, next) => {

    if (req.zip) {
        var querry = "zip=" + req.zip
    } else if (req.lat && req.lon) {
        querry = "lat=" + req.lat + "&lon=" + req.lon
    } else {
        res.status(400).send('🚫Bad request!') 
    }

    let url = 'https://pro.openweathermap.org/data/2.5/forecast/hourly?'+ querry + '&appid=' + process.env.WEATHER_API_KEY + '&cnt=24&units=metric'

    https.get(url, response => {
        let rawData = ''
        response.on('data', chunk => {
            rawData += chunk
            console.log("chunk")
        })
    
        response.on('end', () => {
            const parsedData = JSON.parse(rawData);
            req.weather = parsedData
            console.log("savedparsed data")
            next()
        })

    })
  }, (req,res) => {
    console.log("sending response")
    res.status(200).send(req.weather)
  })



module.exports = router 