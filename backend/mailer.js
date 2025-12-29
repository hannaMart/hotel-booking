const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendBookingConfirmationEmail({ to, booking }) {
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: "Booking confirmation",
    text:
      `Hello ${booking.guestName},\n\n` +
      `Your booking has been confirmed.\n` +
      `Booking number: ${booking.bookingNumber}\n\n` +
      `Room: ${booking.roomTitle}\n` +
      `Check-in: ${booking.checkIn}\n` +
      `Check-out: ${booking.checkOut}\n` +
      `Total price: ${booking.totalPrice} PLN`,
  });

  return info;
}

module.exports = { sendBookingConfirmationEmail };
