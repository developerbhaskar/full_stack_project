const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const router = express.Router();

router.post(
    '/register',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, email, password } = req.body;

        try {
            let user = await User.findOne({ email });

            if (user) {
                return res.status(400).json({ success: false, msg: 'User already exists' });
            }

            user = new User({
                name,
                email,
                password: await bcrypt.hash(password, 10),
            });

            await user.save();

            const payload = { user: { id: user.id, name: user.name } };
            jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
                if (err) throw err;
                res.status(201).json({
                    success: true,
                    msg: 'User registered successfully!',
                    token,
                    user: { id: user.id, name: user.name, email: user.email },
                });
                console.log(user)
            });
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ success: false, msg: 'Server Error' });
        }
    }
);

router.post(
    '/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            let user = await User.findOne({ email });

            if (!user) {
                return res.status(400).json({ success: false, msg: 'Invalid email or password' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, msg: 'Invalid email or password' });
            }

            const payload = { user: { id: user.id, name: user.name } };
            jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
                if (err) throw err;
                res.json({
                    success: true,
                    msg: 'Login successful!',
                    token,
                    user: { id: user.id, name: user.name, email: user.email },
                });
                console.log(user);
            });
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ success: false, msg: 'Server Error' });
        }
    }
);

module.exports = router;
