const nodemailer = require('nodemailer')
//TODO: Put email and s]password into environment variables
const Transport = nodemailer.createTransport({
        service : "Gmail",
        auth: {
            user: process.env.GMAIL_EMAIL,
            pass: process.env.GMAIL_PASSWORD
        }
    });

let sendEmail = (sender, receiver, theSubject, message) => {
   

    var mailOptions = {
        from: sender,
        to: receiver,
        subject: theSubject,
        html: message
    };

    Transport.sendMail(mailOptions, (error, response) => {
        if (error) {
            console.log(error);
        } else {
            console.log("message sent");
        }
    });



}



module.exports = { 
    sendEmail
}