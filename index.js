//express is the framework we're going to use to handle requests
const express = require('express')
//Create a new instance of express
const app = express()

//Access the connection to Heroku Database
const pool = require('./utilities').pool

let middleware = require('./middleware')

/*
 * This middleware function parses JASOn in the body of POST requests
 */
app.use(express.json())

/*
 * This middleware function will respond to improperly formed JSON in 
 * request parameters.
 */
app.use(middleware.jsonErrorInBody)

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use(express.urlencoded({ extended: false }));

app.use('/auth', require('./routes/register.js')) 
app.use('/auth', require('./routes/signin.js')) 
app.use('/auth', middleware.checkToken, require('./routes/pushyregister.js'))
app.use('/verification', require('./routes/verify.js'))
app.use('/forgotpassword', require('./routes/forgotpassword.js'))
app.use('/user', middleware.checkToken, require('./routes/user.js'))
app.use('/messages', middleware.checkToken, require('./routes/messages.js'))
app.use('/chats', middleware.checkToken, require('./routes/chats.js'))
app.use('/contact', middleware.checkToken, require('./routes/contacts.js'))
app.use('/weather', middleware.checkToken, require('./routes/weather.js'))

/*
 * Return HTML for the / end point. 
 * This is a nice location to document your web service API
 * Create a web page in HTML/CSS and have this end point return it. 
 * Look up the node module 'fs' ex: require('fs');
 */
app.get('/', (req, res) => res.sendFile('views/index.html', { root: '.' }));  

/*
 * Serve the API documentation generated by apidoc as HTML. 
 * https://apidocjs.com/
 */
 app.use("/doc", express.static('apidoc'))

/* 
* Heroku will assign a port you can use via the 'PORT' environment variable
* To access an environment variable, use process.env.<ENV>
* If there isn't an environment variable, process.env.PORT will be null (or undefined)
* If a value is 'falsy', i.e. null or undefined, javascript will evaluate the rest of the 'or'
* In this case, we assign the port to be 5000 if the PORT variable isn't set
* You can consider 'let port = process.env.PORT || 5000' to be equivalent to:
* let port; = process.env.PORT;
* if(port == null) {port = 5000} 
*/ 
app.listen(process.env.PORT || 5000, () => {
    console.log("Server up and running on port: " + (process.env.PORT || 5000));
});