const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  money: {
    type: Number
  },
  phoneNo: {
    type: String,
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Will be null until assigned
  },
  status: {
    type: String,
    enum: ['not_assigned', 'assigned', 'in_progress', 'completed'],
    default: 'not_assigned'
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
