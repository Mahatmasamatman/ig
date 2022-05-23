import { check } from 'express-validator';

export const userCreationValidationSchema = [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check(
    'password',
    'Please enter a password with 6 or more characters'
  ).isLength({ min: 6 }),
];

export const userAuthenticationValidationSchema = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists(),
];
