import express from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';

import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { usePayloadToSignTokens } from '../utils/tokenSigner.js';
import { userCreationValidationSchema } from '../utils/validationSchemas.js';

const router = express.Router();

//@route  POST api/users
//@desc   Register a new user
//@access Public
export default router.post(
  '/',
  userCreationValidationSchema,
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      //see if the user already exists
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists.' }] });
      }

      //create new instance of a user
      user = new User({
        name,
        email,
        password,
      });

      //encrypt the password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      //save the user to the database
      await user.save();

      const payload = {
        user: {
          id: user.id,
        },
      };

      //sign the tokens
      const { accessToken, refreshToken } = usePayloadToSignTokens(payload);

      //add the refresh token of the newly created user into the database
      try {
        await RefreshToken.findOneAndUpdate(
          { user: user.id },
          { $set: { created: Date.now(), token: refreshToken } },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
      } catch (err) {
        console.error(err.message);
      }

      //return tokens
      return res.status(200).json({ accessToken, refreshToken });
    } catch (err) {
      console.error(err.message);
      return res.status(500).send('Server error');
    }
  }
);
