import mongoose from 'mongoose';

const userPDFSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  totalPage: {
    type: Number,
  },
  currentPage: {
    type: Number,
    default: 1,
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  lastAccessed: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export default mongoose.model('UserPDF', userPDFSchema);

