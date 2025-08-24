const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: String,
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});


module.exports = mongoose.model('Data', dataSchema);