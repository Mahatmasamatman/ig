import jwt from 'jsonwebtoken';
import config from 'config';

/**
 * @typedef {Object} SignedTokens
 * @property {string} accessToken
 * @property {string} refreshToken
 */

/**
 * Function that signs the Access and Refresh tokens using provided payload
 * @param {*} payload - object that contains anything that we want the content of the tokens to be
 * @returns {SignedTokens}
 */
export function usePayloadToSignTokens(payload) {
  const accessToken = jwt.sign(payload, config.get('jwtAccessSecret'), {
    expiresIn: config.get('jwtAccessExpiration'),
  });
  const refreshToken = jwt.sign(payload, config.get('jwtRefreshSecret'), {
    expiresIn: config.get('jwtRefreshExpiration'),
  });
  return { accessToken, refreshToken };
}
