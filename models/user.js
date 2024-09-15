const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true }
  },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  aadharNo: { type: String, required: true, unique: true },
  phoneNo: { type: String, required: true },
  photo: { type: String }, // Base64-encoded image data
  dropdown: { type: String, enum: ['Senior Citizen', 'Adult'], required: true },
  age: { type: Number, required: true },

  // Track tasks assigned to the user
  assignedTasks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    }
  ],
  
  // Track tasks created by senior citizens
  myCreatedTasks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    }
  ]
});

const User = mongoose.model('User', userSchema);

module.exports = User;
