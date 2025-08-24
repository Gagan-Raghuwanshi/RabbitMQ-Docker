const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const queueService = require('../services/queueService');

exports.registerUser = async (req, res) => {
  try {
    const { email, password, name, role = 'user' } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role
    });

    await queueService.publish('user_registered', {
      event: 'USER_REGISTERED',
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      timestamp: new Date()
    });

    console.log('User registered successfully:', { email: user.email, role: user.role });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('User registration error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    console.log('User logged in successfully:', { email: user.email });

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('User login error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
