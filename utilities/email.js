const nodemailer = require('nodemailer')

const Transport = nodemailer.createTransport({
        service : "Gmail",
        auth: {
            user: "tcss450chat@gmail.com",
            pass: "mykrlmsszhvnvolt"
        }
    });

let sendEmail = (sender, receiver, theSubject, message) => {
    //research nodemailer for sending email from node.
    // https://nodemailer.com/about/
    // https://www.w3schools.com/nodejs/nodejs_email.asp
    //create a burner gmail account 
    //make sure you add the password to the environmental variables
    //similar to the DATABASE_URL and PHISH_DOT_NET_KEY (later section of the lab)

    //fake sending an email for now. Post a message to logs. 

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

    // console.log("*********************************************************")
    // console.log('To: ' + receiver)
    // console.log('From: ' + sender)
    // console.log('Subject: ' + subject)
    // console.log("_________________________________________________________")
    // console.log(message)
    // console.log("*********************************************************")

}



module.exports = { 
    sendEmail
}