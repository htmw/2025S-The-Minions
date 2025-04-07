const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Google OAuth routes
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/auth/login' }),
    (req, res) => {
        try {
            // Generate JWT token
            const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
                expiresIn: '7d'
            });

            // Log the successful authentication
            console.log('Google OAuth successful, redirecting to frontend with token');

            // Redirect to frontend with token
            res.redirect(`http://localhost:3000/auth/success?token=${token}`);
        } catch (error) {
            console.error('Error in Google OAuth callback:', error);
            res.redirect('http://localhost:3000/auth/login?error=auth_failed');
        }
    }
);

// Regular login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if account is locked
        if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
            return res.status(403).json({
                error: 'Account is locked. Please try again later.',
                lockedUntil: user.accountLockedUntil
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            await user.handleFailedLogin();
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Reset failed login attempts on successful login
        user.failedLoginAttempts = 0;
        user.accountLockedUntil = undefined;
        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });

        res.json({ user, token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Register new user
router.post('/register', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });

        res.status(201).json({ user, token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        // TODO: Send email with reset token
        // For now, just return the token (in production, send via email)
        res.json({ message: 'Password reset token generated', resetToken });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reset password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;