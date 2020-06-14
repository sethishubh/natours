/* eslint-disable no-useless-constructor */
//Install nodemailer package npm i nodemailer

const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

//Creating a new email below in comment; user-> user doc containing the email address, and also the name in case we want to personalize the email. ; ->sendWelcome()->  the method that is actually going to send the email. so that one is gonna be sent whenever a new user signs up for our application.; url-> for example, the reset URL for resetting the password.
//new Email(user, url).sendWelcome();
//So below we created a new email class from which we can create email objects that we can then use to send actual emails. And to create a new email object, we will pass in the user and also a URL that we want to be in that email(ie code constructor(user, url)). So then here below in constructor, we assign all that stuff to the current object(ie to this ie code this.to, this.firstName ....), and also some other settings that we want to have available, such as the first name(ie code this.firstName) and the sender email (ie code this.from). So basically to abstract this information away from the send function, and to have it all in one central place. Then we have here below a new transport function(ie newTransport()) which makes it really easy to create different transports for different environments.And so once more, abstracting that logic away from the actual send function which should only be concerned about sending the email.

module.exports = class Email {
  constructor(user, url) {
    //As always, a class needs a constructor function, which is basically the function that is gonna be running when a new object is created through this class.
    //So, each object created from this class will then get these all below defined properties like this.to, this.firstName, .... .
    //Now let's actually take a look at how we would use this class in practice. And so the idea, basically, whenever we want to send a new email, is to import this email class and then use it like this above (ie in new Email(user).... above)
    // And since we passed the user and the URL into a new email (ie in above comment new Email(user, url) ),  well, our constructor then needs to take these(ie user, url) in as arguments above.
    this.to = user.email;
    //defining d 1st name of d user below to basically personalize the email.
    this.firstName = user.name.split(' ')[0];
    this.url = url; //this.url = incoming url from argument above
    this.from = `Shubham Sethi <${process.env.EMAIL_FROM}>`;
  }

  //creating a method below in order to create the transport similar to const transporter in const sendEmail code below
  newTransport() {
    //now below here we actually want to have different transports whether we are in production or not. So when we're in production, we actually want to send real emails, and we will do that a bit later using SendGrid, but if we are not in production then we still want to use our Mailtrap application just like we did it before when we send emails. So instead of the email going to a real email address, it will get caught into our Mailtrap inbox so that we can actually take a look at it in our development process.
    if (process.env.NODE_ENV === 'production') {
      //creating transporter for Sendgrid
      //Using SendGrid to send real emails to real email inboxes (And NOT sending to testing email inboxes like Mailtrap.io's inbox) Rather than to our development inbox at Mailtrap.io  ; real email inboxes = real user's email inbox and NOT Mailtrap.io's email inbox.

      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        }, //Now signup a new user in postman with a real/disposable email address created at mailsac.com or u can also use ur own/personal email address. And now after signup of a new user in production mode, a welcome email will be sent to d mailsec email address of d user or ur(user's) personal email address by Sendgrid service.
      });
    }
    //else when we're in development mode, then returning a new nodemailer transport below
    return nodemailer.createTransport({
      //service: 'Gmail',
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  //Below send() is gonna be the method that will do the actual sending.
  async send(template, subject) {
    //Send the actual email ; template -> pug template
    // 1) render the HTML for the email based on a pug template. So basically the one that we're passing into above in send(template, subject) code with template.
    //And usually up until this point, we only ever use pug to create a template, and then we pass the name of the template into the render function on the response. So we always just used it like this res.render('name of d pug template');. And what this render function does behind the scenes is to basically create the HTML based on the pug template and then send it to the client. Now in this case we do not really want to render, all we want to do is to basically create the HTML out of the template so that we can then send that HTML as the email. So basically defining it here below in const mailOptions as an HTML option into these mail options below. So, remember how we can specify text and HTML in const mailOptions. And mainly we are interested in sending an HTML email. And so that's why we're gonna have a pug template from which we will generate this HTML. So it's not gonna be working like this(ie res.render('...');). but instead we actually need to require the pug package here above at top.
    //Below -> pug.renderFile() -> It will take in the file and then render the pug code into real HTML.
    const html = pug.renderFile(
      `${__dirname}/../views/email/${template}.pug`,
      //Below passing the variables into `${__dirname}/../views/emails/${template}.pug` pug file/template
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );
    // 2) define the email options,

    const mailOptions = {
      from: this.from, //'Shubham Sethi <sethi1@gmail.com>', //Where the email is coming from
      to: this.to, //options.email, //Recipient's address, options = 'options object' coming as an "argument of sendEmail() f'n" above
      subject: subject, //options.subject, // subject: subject<- coming from arguments in send(template, subject) above
      html: html,
      //Below we also want to include a text version of our email into the email. And that's actually really important because it's better for email delivery rates and also for spam folders. And also some people just prefer plain simple text emails instead of having the more formatted HTML emails. And so basically, we need a way of converting all the HTML to simple text. So stripping out all of the HTML leaving only the content. And for doing that, we are going to install yet another package, and so this one is called html-to-text.
      //Contd.. npm i html-to-text
      text: htmlToText.fromString(html), //options.message, //text version of the email
    };

    // 3) Create a transport and send email.
    console.log(mailOptions);
    await this.newTransport().sendMail(mailOptions);
  }

  //Below Creating f'n for Sending welcome email to d new user on sign-up
  async sendWelcome() {
    //below await coz this.send is an async f'n
    await this.send('welcome', 'Welcome to the Natours Family'); //this -> current object ; welcome-> welcome.pug-> pug template to send d welcome email
  }

  //Below Creating f'n for Sending p/w reset email to d user
  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }
};

//RECENT Commented after creation of above class code from top
//const sendEmail = async (options) => {
// 1) Create a transporter(transporter = a service that will actually send the email like gmail for e.g. and NOT Node.js)
//RECENT Commented after above class Email code creation
// const transporter = nodemailer.createTransport({
//   //service: 'Gmail',
//   host: process.env.EMAIL_HOST,
//   port: process.env.EMAIL_PORT,
//   auth: {
//     user: process.env.EMAIL_USERNAME,
//     pass: process.env.EMAIL_PASSWORD, //Now in ur gmail a/c activate the less secure app option
//   },
//   // Activate in gmail "less secure app" option
//   //Using gmail for this kind of stuff for a production app is not a good idea as we can only send  500 emails/day and very quickly we will be marked as spammer
//   //So, We are using a special development service instead of gmail which basically fakes to send emails to real addresses. But in reality, these emails end up trapped in a development box, so that we can then take a look at how they will look later in production. So that service is called MailTrap
//   // So with MailTrap service, we can fake to send emails to clients, but these emails will never reach these clients and will be trapped in ur mailTrap
// });

// console.log(
//   'host, port, auth',
//   transporter.host,
//   transporter.port,
//   transporter.auth
// );
// console.log(
//   process.env.EMAIL_HOST,
//   process.env.EMAIL_PORT,
//   process.env.EMAIL_USERNAME,
//   process.env.EMAIL_PASSWORD
// );

// 2) Define the email options

//RECENT Commented after inclusion in above code in send(template, subject) code above
// const mailOptions = {
//   from: 'Shubham Sethi <sethi1@gmail.com>', //Where the email is coming from
//   to: options.email, //Recipient's address, options = 'options object' coming as an "argument of sendEmail() f'n" above
//   subject: options.subject,
//   text: options.message, //text version of the email
// };
//console.log('mailOptions:', mailOptions);

// 3) Actually send the email

//await transporter.sendMail(mailOptions); //And here this sendMail f'n will return promise, so writing await here and async above in send'E'mail() f'n
//};

//module.exports = sendEmail;
