const jwt = require('jsonwebtoken');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET_KEY;

// Helper function to validate password
const isPasswordValid = (password) => {
  const passwordRegex = /^(?=.*\d)(?=.*[a-zA-Z])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
  return passwordRegex.test(password);
};

// Helper function to validate aadhar number
const isAadharValid = (aadharNo) => {
  const aadharRegex = /^\d{12}$/;
  return aadharRegex.test(aadharNo);
};

// Helper function to validate email
const isEmailValid = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const register = async (req, res) => {
  try {
    console.log('Request Body:', req.body); // Debugging: Check request body

    const {
      name,
      email,
      password,
      address,
      gender,
      aadharNo,
      phoneNo,
      photo,  // Base64 image string
      dropdown,
      age
    } = req.body;

    // Validate input fields
    if (!name || !email || !password || !address || !gender || !aadharNo || !phoneNo || !dropdown || !age) {
      return res.status(400).json({ error: 'All fields except photo are required' });
    }

    // Validate email
    if (!isEmailValid(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password
    if (!isPasswordValid(password)) {
      return res.status(400).json({ error: 'Password must be at least 12 characters long and include numbers, letters, and symbols' });
    }

    // Validate aadhar number
    if (!isAadharValid(aadharNo)) {
      return res.status(400).json({ error: 'Aadhar number must be exactly 12 digits without hyphens' });
    }

    // Check if user with the same email or aadhar number already exists
    const existingUser = await User.findOne({ $or: [{ email }, { aadharNo }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User with the same email or aadhar number already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle Base64 image
    let photoPath = null;
    if (photo) {
      const base64Data = photo.replace(/^data:image\/png;base64,/, ""); // Adjust based on image type
      const imagePath = path.join(__dirname, '../uploads', `${Date.now()}.png`); // Adjust path and extension
      fs.writeFileSync(imagePath, base64Data, 'base64');
      photoPath = `/uploads/${path.basename(imagePath)}`; // URL/path of the uploaded image
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      address: {
        street: address.street,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode
      },
      gender,
      aadharNo,
      phoneNo,
      photo: photoPath,
      dropdown,
      age
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ message: 'User registered successfully', user: newUser, token });
  } catch (error) {
    console.error('Error:', error); // Debugging: Log the error
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error:', error); // Debugging: Log the error
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register, login };
