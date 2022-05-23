import mongoose from 'mongoose';

const RefreshTokenSchema = new mongoose.Schema({
  token: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  created: { type: Date, default: Date.now },
});

const RefreshToken = mongoose.model('refreshToken', RefreshTokenSchema);

export default RefreshToken;
