import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true, // Google OAuth의 sub 값 (고유)
    index: true,
  },
  email: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  picture: {
    type: String,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true, // createdAt, updatedAt 자동 생성
});

export default mongoose.model('User', userSchema);

