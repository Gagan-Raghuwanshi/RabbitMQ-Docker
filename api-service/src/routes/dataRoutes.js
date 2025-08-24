const express = require('express');
const { getDataById, createData, getAllData } = require('../controllers/dataController');
const { authenticateToken } = require('../middleware/auth');
const { validateData } = require('../middleware/validation');

const router = express.Router();

router.post('/', authenticateToken, validateData, createData);
router.get('/get-all-data', authenticateToken, getAllData);
router.get('/:id', authenticateToken, getDataById);

module.exports = router;