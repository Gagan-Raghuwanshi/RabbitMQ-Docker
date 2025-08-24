const express = require('express');
const { getAllData, getAllUsers } = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/users', authenticateToken, requireRole('admin'), getAllUsers);

module.exports = router;