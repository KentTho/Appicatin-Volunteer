const nodemailer = require("nodemailer");
require("dotenv").config();

const sendEmail = async ({ to, subject, text }) => {
  // <-- nhận dạng object
  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
  });

  await transporter.sendMail({
    from: '"Elderly Volunteer App" <noreply@yourapp.com>',
    to,
    subject,
    text,
  });
};

module.exports = sendEmail;
