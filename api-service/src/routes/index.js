const express = require('express');
const userRoutes = require('./userRoutes');
const dataRoutes = require('./dataRoutes');
const adminRoutes = require('./adminRoutes');

const router = express.Router();

router.use('/user', userRoutes);
router.use('/admin', adminRoutes);
router.use('/data', dataRoutes);

module.exports = router;