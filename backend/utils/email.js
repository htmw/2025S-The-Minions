const nodemailer = require('nodemailer');
const { logger } = require('./logger');

// Create a transporter using SMTP configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Verify SMTP connection
transporter.verify((error, success) => {
    if (error) {
        logger.error('SMTP connection error:', error);
    } else {
        logger.info('SMTP server is ready to send emails');
    }
});

// Email templates
const templates = {
    passwordReset: (resetToken) => ({
        subject: 'Password Reset Request',
        html: `
            <h1>Password Reset Request</h1>
            <p>You have requested to reset your password. Click the link below to proceed:</p>
            <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}">
                Reset Password
            </a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
        `
    }),
    passwordResetSuccess: {
        subject: 'Password Reset Successful',
        html: `
            <h1>Password Reset Successful</h1>
            <p>Your password has been successfully reset.</p>
            <p>If you didn't make this change, please contact support immediately.</p>
        `
    }
};

// Send email function
const sendEmail = async (to, template, data = {}) => {
    try {
        const { subject, html } = templates[template](data);
        
        const mailOptions = {
            from: '"ImageMedix" <noreply@imagemedix.com>',
            to,
            subject,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info('Email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        logger.error('Error sending email:', error);
        throw error;
    }
};

module.exports = {
    sendEmail,
    templates
}; 