import express from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from 'config';

import auth from '../middleware/auth.js';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { usePayloadToSignTokens } from '../utils/tokenSigner.js';
import { userAuthenticationValidationSchema } from '../utils/validationSchemas.js';

const router = express.Router();

//@route  GET api/auth
//@desc   Test route: if it receives a valid jwt, it returns info about users profile
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

// @route    POST api/auth
// @desc     Log-in route: Authenticate user & return access and refresh token
// @access   Public
router.post('/', userAuthenticationValidationSchema, async (req, res) => {
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

    //the credentials are valid, return jsonwebtoken
    const payload = {
      user: {
        id: user.id,
      },
    };

    const { accessToken, refreshToken } = usePayloadToSignTokens(payload);

    try {
      await RefreshToken.findOneAndUpdate(
        { user: user.id },
        { $set: { created: Date.now(), token: refreshToken } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    } catch (err) {
      console.error(err.message);
    }

    res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route    POST api/auth/refresh-token
// @desc     Refresh the token route: get a valid, unexpired refresh token, return a new set of tokens
// @access   Public
router.post('/refresh-token', async (req, res) => {
  let receivedRefreshToken = req.headers['x-auth-token'];

  if (!receivedRefreshToken) {
    return res.status(403).send({ message: 'No token provided!' });
  }

  //verify token
  try {
    jwt.verify(
      receivedRefreshToken,
      config.get('jwtRefreshSecret'),
      (error, decoded) => {
        if (!error) {
          req.user = decoded.user;
        } else {
          //user should re-log, as the refresh token has expired
          //only way to get a new one now is to re-enter the credentials
          console.error('Error in token validation - probably expired.');
          return res.status(401).json({ msg: 'Token is not valid' });
        }
      }
    );
  } catch (err) {
    console.error('Something went wrong with token verification.');
    return res.status(500).json({ msg: 'Server error' });
  }

  //get current users current refresh token from the database
  //compare it with valid incoming token to see if it hasn't been rotated out
  try {
    //Fetch the users saved token from the database
    let savedRefreshToken = await RefreshToken.findOne({
      user: req.user.id,
    }).select('token');

    if (!(savedRefreshToken.token === receivedRefreshToken)) {
      //If we are here, the token is valid, but it has been rotated out (doesn't match the one in the database)
      return res.status(500).send('Invalid token');
    }
  } catch (err) {
    console.log(err.message);
    return res.status(500).send('Server error');
  }

  //generate new tokens, update the users refresh token in the database (rotate it)
  //issue new access and refresh token

  const payload = {
    user: {
      id: req.user.id,
    },
  };

  const { accessToken, refreshToken } = usePayloadToSignTokens(payload);

  try {
    await RefreshToken.findOneAndUpdate(
      { user: req.user.id },
      { $set: { created: Date.now(), token: refreshToken } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server error');
  }

  res.json({ accessToken, refreshToken });
});

export default router;
