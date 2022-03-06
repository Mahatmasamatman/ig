import express from 'express';
import { check, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from 'config';

import auth from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

//@route  GET api/auth
//@desc   Test route - if it receives a valid jwt, it returns info about users profile
//@access Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

const userAuthenticationValidation = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists(),
];

// @route    POST api/auth
// @desc     Authenticate user & return access and refresh token
// @access   Public
router.post('/', userAuthenticationValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    //check if the user exists by searching for the email
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
    }

    //check if the supplied password matches for the found user
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
    }

    //return jsonwebtoken
    const payload = {
      user: {
        id: user.id,
      },
    };

    const accessToken = jwt.sign(payload, config.get('jwtAccessSecret'), {
      expiresIn: config.get('jwtAccessExpiration'),
    });
    const refreshToken = jwt.sign(payload, config.get('jwtRefreshSecret'), {
      expiresIn: config.get('jwtRefreshExpiration'),
    });

    res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});
