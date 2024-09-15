const express = require('express');
const { getUserProfile, updateUserProfile, getMyTasks, getUserCompletedTasks } = require('../controllers/userController');
const { authenticateUser } = require('../utils/authenticate');
const router = express.Router();

router.get('/:userId/profile', authenticateUser , getUserProfile);
router.put('/:userId/update', authenticateUser, updateUserProfile);
router.get('/:userId/getMyTasks',getMyTasks)
router.get('/:userId/completedTasks', getUserCompletedTasks);

module.exports = router;
