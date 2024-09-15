const express = require('express');
const { createTask, editTask, deleteTask, getAllTasks, getTaskById, assignTaskToUser, completeTask, getTasksByStatus, getNotifications } = require('../controllers/taskController');
const router = express.Router();

router.post('/addtask', createTask);
router.post('/edittask/:taskId',editTask);
router.delete('/deletetask/:taskId',deleteTask);
router.get('/getAllTask',getAllTasks);
router.get('/getTaskById/:taskId',getTaskById);
router.post('/:taskId/assign',assignTaskToUser);
router.post('/:taskId/complete',completeTask);
router.get('/status/:status',getTasksByStatus);
router.get('/notifications',getNotifications);

module.exports = router;
