import jwt from 'jsonwebtoken';
import config from 'config';

export default function (req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if the token is missing
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    jwt.verify(token, config.get('jwtAccessSecret'), (error, decoded) => {
      if (!error) {
        req.user = decoded.user;
        next();
      } else {
        return res.status(401).json({ msg: 'Token is not valid' });
      }
    });
  } catch (err) {
    console.error('something wrong with auth middleware');
    res.status(500).json({ msg: 'Server Error' });
  }
}
