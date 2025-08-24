const Data = require('../models/Data');
const cacheService = require('../services/cacheService');

exports.createData = async (req, res) => {
  try {
    const { name, value, isPublic = false } = req.body;

    const data = await Data.create({
      name,
      value,
      isPublic,
      createdBy: req.user.userId
    });

    console.log('Data created successfully:', { dataId: data._id, createdBy: req.user.userId });
    return res.status(201).json({
      success: true,
      message: 'Data created successfully',
      data
    });
  } catch (error) {
    console.error('Create data error:', error.message);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};

exports.getAllData = async (req, res) => {
  try {
    const { role, userId } = req.user.role;

    let query = {};
    if (role !== 'admin') {
      query = {
        $or: [
          { isPublic: true },
          { createdBy: userId }
        ]
      };
    }

    const data = await Data.find(query).populate('createdBy', 'email name').lean();

    return res.json({
      success: true,
      data,
      count: data.length
    });
  } catch (error) {
    console.error('Get all data error:', error.message);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};

exports.getDataById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `data:${id}`;

    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      console.log('Cache hit for data:', { dataId: id });
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true
      });
    }

    const data = await Data.findById(id).lean();
    if (!data) return res.status(404).json({ error: 'Data not found' });
    if (!data.isPublic && data.createdBy.toString() !== req.user.userId) return res.status(403).json({ error: 'Access denied' });

    await cacheService.set(cacheKey, data, 300);

    console.log('Data cached:', { dataId: id });
    return res.json({
      success: true,
      data,
      fromCache: false
    });
  } catch (error) {
    console.error('Get data error:', error.message);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};
