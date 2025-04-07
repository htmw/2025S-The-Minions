const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: function() {
            return !this.googleId; // Password is required only if not using Google OAuth
        },
        minlength: 6
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['doctor', 'admin', 'researcher'],
        default: 'doctor'
    },
    specialization: {
        type: String,
        trim: true
    },
    department: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLogin: Date,
    // Google OAuth fields
    googleId: {
        type: String,
        sparse: true,
        unique: true
    },
    googleProfile: {
        picture: String,
        locale: String
    },
    // Additional fields for audit
    lastPasswordChange: Date,
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    accountLockedUntil: Date
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        this.lastPasswordChange = new Date();
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to handle failed login attempts
userSchema.methods.handleFailedLogin = async function() {
    this.failedLoginAttempts += 1;
    if (this.failedLoginAttempts >= 5) {
        this.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
    }
    await this.save();
};

// Method to reset failed login attempts
userSchema.methods.resetFailedLoginAttempts = async function() {
    this.failedLoginAttempts = 0;
    this.accountLockedUntil = undefined;
    await this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User; 