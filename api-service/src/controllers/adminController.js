const Data = require('../models/Data');
const User = require('../models/User');


exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');

    return res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('Get all users error:', error.message);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
