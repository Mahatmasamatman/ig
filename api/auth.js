import express from 'express';

const router = express.Router();

//@route  GET api/auth
//@desc   Test route
//@access Public
export default router.get('/', (req, res) => res.send('User route'));
