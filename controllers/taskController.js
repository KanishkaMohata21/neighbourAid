const notifications = require('../models/notifications');
const Task = require('../models/task');
const User = require('../models/user');
const fs = require('fs');
const path = require('path');

// Helper function to handle Base64 image
const handleBase64Image = (base64Image) => {
  if (!base64Image) return null;
  
  const base64Data = base64Image.replace(/^data:image\/png;base64,/, ""); // Adjust based on image type
  const imagePath = path.join(__dirname, '../uploads', `${Date.now()}.png`); // Adjust path and extension
  fs.writeFileSync(imagePath, base64Data, 'base64');
  return `/uploads/${path.basename(imagePath)}`; // URL/path of the uploaded image
};

const createTask = async (req, res) => {
  try {
    const { userId, title, description, phoneNo, address, money } = req.body;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only allow senior citizens to create tasks
    if (user.dropdown !== 'Senior Citizen') {
      return res.status(403).json({ error: 'Only senior citizens can create tasks' });
    }

    // Create a new task
    const newTask = new Task({
      userId: user._id,
      title,
      description,
      phoneNo,
      address,
      money
    });

    // Save the task
    const task = await newTask.save();

    // Add the task to the senior citizen's `myCreatedTasks`
    user.myCreatedTasks.push(task._id);
    await user.save();

    res.status(201).json({
      message: 'Task successfully created',
      task
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: error.message });
  }
};



const editTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.body;
    const { title, description, image, money, address,phoneNo } = req.body;

    // Validate if the task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Validate if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the user is the creator of the task
    if (task.userId.toString() !== userId) {
      return res.status(403).json({ error: 'You are not authorized to edit this task' });
    }

    // Optional: Check if the user is a senior citizen (if required)
    if (user.dropdown !== 'Senior Citizen') {
      return res.status(403).json({ error: 'Only senior citizens are allowed to modify tasks' });
    }

    // Handle image update
    let updatedImage = task.image; // Keep the existing image if not updated
    if (image) {
      updatedImage = handleBase64Image(image);
    }

    // Update task details
    task.title = title || task.title;
    task.description = description || task.description;
    task.image = updatedImage || task.image;
    task.money = money || task.money;
    task.address = address || task.address;
    task.phoneNo = phoneNo || task.phoneNo;

    // Save the updated task
    const updatedTask = await task.save();

    res.status(200).json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.body; // Assuming the userId is passed in the body

    // Validate if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the user is a senior citizen
    if (user.dropdown !== 'Senior Citizen') {
      return res.status(403).json({ error: 'Only senior citizens can delete tasks' });
    }

    // Find the task by ID
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if the user is the creator of the task
    if (task.userId.toString() !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this task' });
    }

    // Delete the task
    await task.deleteOne();

    res.status(200).json({
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getAllTasks = async (req, res) => {
  try {
    // Fetch all tasks along with the user information
    const tasks = await Task.find().populate('userId', 'name email phoneNo dropdown'); // Populates user details like name, email, phoneNo, and dropdown

    res.status(200).json({
      message: 'All tasks fetched successfully',
      tasks: tasks 
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Find the task by ID and populate user details (name, email, phoneNo, dropdown)
    const task = await Task.findById(taskId).populate('userId', 'name email phoneNo dropdown');
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Send back the task details
    res.status(200).json({
      message: 'Task fetched successfully',
      task
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

const assignTaskToUser = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.body;

    // Find the task by ID
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Ensure the task is not already assigned
    if (task.assignedTo) {
      return res.status(400).json({ error: 'Task is already assigned to another user' });
    }

    // Ensure the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Mark the task as assigned to this user
    task.assignedTo = userId;
    task.status = 'assigned'; // Update status to 'assigned'
    const updatedTask = await task.save();

    // Add the task to the user's `assignedTasks` list
    user.assignedTasks.push(task._id);
    await user.save();

    // Create notification for task assignment
    await notifications.create({
      userId: userId,
      message: `You have been assigned a new task: ${task.title}`,
      type: 'assignment',
      taskId: task._id
    });

    res.status(200).json({
      message: 'Task successfully assigned to the user',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

const completeTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Find the task by ID
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if the task is already completed
    if (task.status === 'completed') {
      return res.status(400).json({ error: 'Task is already completed' });
    }

    // Update the task status to completed
    task.status = 'completed';
    const updatedTask = await task.save();

    // Create notification for task completion
    await notifications.create({
      userId: task.userId,
      message: `Your task "${task.title}" has been marked as completed.`,
      type: 'completion',
      taskId: task._id
    });

    res.status(200).json({
      message: 'Task successfully marked as completed',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getTasksByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    // Validate status
    const validStatuses = ['not assigned', 'assigned', 'in progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Fetch tasks by status
    const tasks = await Task.find({ status });
    
    res.status(200).json({
      message: 'Tasks retrieved successfully',
      tasks
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};


// Fetch notifications for a user
const getNotifications = async (req, res) => {
  try {
    const { userId } = req.query;

    // Validate if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch notifications related to the user
    const notifications = await Notification.find({ userId })
      .sort({ timestamp: -1 }); // Sort by most recent

    res.status(200).json({
      message: 'Notifications retrieved successfully',
      notifications
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getNotifications };


module.exports = { createTask,editTask,deleteTask,getAllTasks,getTaskById,assignTaskToUser,completeTask,getTasksByStatus,getNotifications };
