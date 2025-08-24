const express = require('express');
const { registerUser, loginUser } = require('../controllers/userController');
const { validateRegister, validateLogin } = require('../middleware/validation');

const router = express.Router();

router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);

module.exports = router;