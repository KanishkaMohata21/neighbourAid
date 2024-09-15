const bcrypt = require('bcrypt');
const User = require('../models/user');
const fs = require('fs');
const path = require('path');
const task = require('../models/task');
require('dotenv').config();


const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(req.headers);

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user profile data
    res.status(200).json({ user });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      name,
      email,
      password,
      address,
      gender,
      aadharNo,
      phoneNo,
      photo, // Base64 image string
      dropdown,
      age
    } = req.body;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Check if the email is already taken
    if (email && email !== user.email) {
      const existingEmailUser = await User.findOne({ email });
      if (existingEmailUser) {
        return res.status(400).json({ msg: "Email is already in use" });
      }
    }

    // Check if the username is already taken (if applicable)
    if (name && name !== user.name) {
      const existingUsernameUser = await User.findOne({ name });
      if (existingUsernameUser) {
        return res.status(400).json({ msg: "Username is already taken" });
      }
    }

    // Update user profile
    user.name = name || user.name;
    user.email = email || user.email;
    if (password) {
      // Hash the password before saving
      const salt = await bcrypt.genSalt(10); // Adjust the salt rounds as needed
      user.password = await bcrypt.hash(password, salt);
    }
    user.address = address || user.address;
    user.gender = gender || user.gender;
    user.aadharNo = aadharNo || user.aadharNo;
    user.phoneNo = phoneNo || user.phoneNo;

    // Handle Base64 image
    if (photo) {
      // Remove existing photo if any
      if (user.photo) {
        const existingPhotoPath = path.join(__dirname, '../uploads', path.basename(user.photo));
        if (fs.existsSync(existingPhotoPath)) {
          fs.unlinkSync(existingPhotoPath);
        }
      }

      // Process new Base64 image
      const base64Data = photo.replace(/^data:image\/png;base64,/, ""); // Adjust based on image type
      const imagePath = path.join(__dirname, '../uploads', `${Date.now()}.png`); // Adjust path and extension
      fs.writeFileSync(imagePath, base64Data, 'base64');
      user.photo = `/uploads/${path.basename(imagePath)}`; // URL/path of the uploaded image
    }

    user.dropdown = dropdown || user.dropdown;
    user.age = age || user.age;

    // Save updated user information
    const updatedUser = await user.save();

    return res.status(200).json({
      msg: "User profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
};

const getMyTasks = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch tasks created by the user
    const createdTasks = await task.find({ userId });

    // Fetch tasks assigned to the user
    const assignedTasks = await task.find({ assignedTo: userId });

    // Return both types of tasks separately
    res.status(200).json({
      message: 'Tasks retrieved successfully',
      createdTasks: createdTasks,
      assignedTasks: assignedTasks
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getUserCompletedTasks = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch completed tasks assigned to the user
    const assignedTasks = await task.find({
      assignedTo: userId,
      status: 'completed'
    });

    // Fetch completed tasks created by the user
    const createdTasks = await task.find({
      userId: userId,
      status: 'completed'
    });

    // Combine created and assigned tasks
    const completedTasks = [...assignedTasks, ...createdTasks];

    // Return the list of completed tasks
    res.status(200).json({
      message: 'Completed tasks retrieved successfully',
      completedTasks: completedTasks
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};


module.exports = { getUserProfile, updateUserProfile, getMyTasks, getUserCompletedTasks };
