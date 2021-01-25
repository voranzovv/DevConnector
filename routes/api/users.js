const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../../models/User')
const gravatar = require('gravatar');
const jwt = require('jsonwebtoken');
const config = require('config')
 
router.post('/', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please inclue a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more charactors').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const { name, email, password } = req.body;

        // see if the user exists
        let user = await User.findOne({ email: email });
        if (user) {
            res.status(500).json({ msg: "User already exists" })
        }

        //get user gravatar
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        })

        user = new User({
            name,
            email,
            avatar,
            password
        });

        //Encrypt password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        //return user web token
        // res.send('user registered');
        const payload = {
            user: user.id,
        }

        jwt.sign(
            payload,
            config.get('jwtSecret'),
            { expiresIn: 3600000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token })
            }
        )

    } catch (error) {
        console.log(error.message);
        res.status(500).send("server error")

    }

})

module.exports = router;