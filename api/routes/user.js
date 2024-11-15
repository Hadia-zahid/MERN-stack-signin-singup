const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
// Signup 
router.post('/signup', async (req, res, next) => {
    const { email, password, username } = req.body;

    // checking all fields given or not
    if (!email || !password || !username) {
        return res.status(400).json({ message: 'All fields are required.' });
        
    }
    if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    try {
        // Checking  email already exist
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use.' });
        }

        // Hash the password 
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                return res.status(500).json({
                    error: err
                });
            }

            
            const user = new User({
                username: username,
                password: hash,
                email: email
            });

            // Save  to the database
            user.save()
                .then(result => {
                    res.status(201).json({ message: 'User created successfully.' });
                })
                .catch(err => {
                    res.status(500).json({
                        error: err
                    });
                });
        });
    } catch (err) {
        res.status(500).json({
            error: err
        });
    }
});

// Login 
router.post('/login', (req, res, next) => {
    // Find user 
    User.find({ username: req.body.username })
        .then(user => {
            if (user.length < 1) {
                return res.status(401).json({
                    msg: 'User does not exist'
                });
            }

            //  password checking for login
            bcrypt.compare(req.body.password, user[0].password, (err, result) => {
                if (err) {
                    return res.status(500).json({ msg: 'Error comparing passwords' });
                }

                if (!result) {
                    return res.status(401).json({
                        msg: 'Password matching failed'
                    });
                }

                
                const token = jwt.sign(
                    {
                        username: user[0].username,
                        email: user[0].email
                    },
                    process.env.JWT_SECRET, 
                    {
                        expiresIn: '24h'
                    }
                );

                res.status(200).json({
                    username: user[0].username,
                    email: user[0].email,
                    token: token
                });
            });
        })
        .catch(err => {
            res.status(500).json({
                err: err
            });
        });
});

module.exports = router;
