const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');

router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user).select('-password');
        res.json(user);
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error');
    }
})

router.post('/', [
    check('email', 'Please inclue a valid email').isEmail(),
    check('password', 'Password is required')
        .exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const { name, email, password } = req.body;

        // see if the user exists
        let user = await User.findOne({ email: email });
        if (!user) {
            res.status(500)
                .json({ msg: "Invalid  Credential" })
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res
                .status(400)
                .json({ error: [{ msg: 'Invalid Credential' }] })
        }

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