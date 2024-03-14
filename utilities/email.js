const nodemailer = require('nodemailer');
const pug = require('pug');
const { htmlToText } = require('html-to-text');

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.from = `Elisha Onyando <${process.env.EMAIL_FROM}>`;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
    };

    newTransport() {
        //Sending real emails in prod environment
        if (process.env.NODE_ENV === 'prod') {
            return nodemailer.createTransport({
                service: 'Brevo',
                host: process.env.BREVO_HOST,
                port: process.env.BREVO_PORT,
                auth: {
                    user: process.env.BREVO_LOGIN,
                    pass: process.env.BREVO_PASSWORD
                }
            })
        };
        // Sending emails in dev environment
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    };

    async send(template, subject) {
        //1. Render HTML based on a pug template
        const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject
        });

        //2. Define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText(html)
        };

        //3. Create a transport and send email
        await this.newTransport().sendMail(mailOptions);

    };

    async sendWelcome() {
        await this.send('welcome', 'WELCOME TO NATOURS FAMILY');
    };

    async sendPasswordReset() {
        await this.send('passReset', 'YOUR PASSWORD RESET TOKEN');
    };
};