// src/controllers/adminController.js
const User = require('../models/User');
const Graduate = require('../models/Graduate');
const Farmer = require('../models/Farmer');
const ServiceRequest = require('../models/serviceRequest');

exports.getPlatformStats = async (req, res) => {
  try {
    // Get real statistics from database
    const totalFarmers = await Farmer.countDocuments();
    const totalGraduates = await Graduate.countDocuments();
    const activeRequests = await ServiceRequest.countDocuments({ 
      status: { $in: ['pending', 'assigned', 'in_progress'] } 
    });
    const completedServices = await ServiceRequest.countDocuments({ 
      status: 'completed' 
    });
    const pendingRegistrations = await User.countDocuments({ 
      isActive: false 
    });

    res.json({
      totalFarmers,
      totalGraduates,
      activeRequests,
      completedServices,
      pendingRegistrations,
      revenueThisMonth: 0 // Placeholder for future payment integration
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({ error: 'Failed to fetch platform statistics' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.getGraduates = async (req, res) => {
  try {
    const graduates = await Graduate.find()
      .populate('user', 'name phoneNumber email isActive')
      .sort({ createdAt: -1 });

    res.json(graduates);
  } catch (error) {
    console.error('Error fetching graduates:', error);
    res.status(500).json({ error: 'Failed to fetch graduates' });
  }
};

exports.getFarmers = async (req, res) => {
  try {
    const farmers = await Farmer.find()
      .populate('user', 'name phoneNumber email isActive')
      .sort({ createdAt: -1 });

    res.json(farmers);
  } catch (error) {
    console.error('Error fetching farmers:', error);
    res.status(500).json({ error: 'Failed to fetch farmers' });
  }
};

exports.getServiceRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    if (status) filter.status = status;

    const requests = await ServiceRequest.find(filter)
      .populate('farmer', 'province district sector cell')
      .populate('farmer.user', 'name phoneNumber')
      .populate('graduate', 'expertise province district')
      .populate('graduate.user', 'name phoneNumber')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ServiceRequest.countDocuments(filter);

    res.json({
      requests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ error: 'Failed to fetch service requests' });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user 
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

// Helper function to get requests over time
async function getRequestsOverTime() {
  const now = new Date();
  
  // Daily data (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const daily = await ServiceRequest.aggregate([
    {
      $match: {
        createdAt: {
          $gte: sevenDaysAgo
        }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt'
          }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        date: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);

  // Weekly data (last 8 weeks)
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
  
  const weekly = await ServiceRequest.aggregate([
    {
      $match: {
        createdAt: { $gte: eightWeeksAgo }
      }
    },
    {
      $group: {
        _id: {
          $week: '$createdAt'
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        week: { $concat: ['Week ', { $toString: '$_id' }] },
        count: 1,
        _id: 0
      }
    }
  ]);

  // Monthly data (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const monthly = await ServiceRequest.aggregate([
    {
      $match: {
        createdAt: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m',
            date: '$createdAt'
          }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        month: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);

  return {
    daily,
    weekly,
    monthly
  };
}

// Helper function to get top performing data
async function getTopPerformingData() {
  // Get best province
  const bestProvinceResult = await ServiceRequest.aggregate([
    {
      $match: {
        province: { $ne: null, $ne: '' }
      }
    },
    {
      $group: {
        _id: '$province',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 1 }
  ]);

  const bestProvince = bestProvinceResult.length > 0 ? {
    name: bestProvinceResult[0]._id || 'Unknown',
    count: bestProvinceResult[0].count
  } : { name: 'No data', count: 0 };

  // Get best district
  const bestDistrictResult = await ServiceRequest.aggregate([
    {
      $match: {
        district: { $ne: null, $ne: '' }
      }
    },
    {
      $group: {
        _id: '$district',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 1 }
  ]);

  const bestDistrict = bestDistrictResult.length > 0 ? {
    name: bestDistrictResult[0]._id || 'Unknown',
    count: bestDistrictResult[0].count
  } : { name: 'No data', count: 0 };

  // Get highest service type
  const highestServiceTypeResult = await ServiceRequest.aggregate([
    {
      $group: {
        _id: '$serviceType',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 1 }
  ]);

  const highestServiceType = highestServiceTypeResult.length > 0 ? {
    name: highestServiceTypeResult[0]._id || 'Unknown',
    count: highestServiceTypeResult[0].count
  } : { name: 'No data', count: 0 };

  return {
    bestProvince,
    bestDistrict,
    highestServiceType
  };
}

exports.getAnalytics = async (req, res) => {
  try {
    // Get analytics data for charts and reports
    const serviceRequestsByType = await ServiceRequest.aggregate([
      {
        $group: {
          _id: '$serviceType',
          count: { $sum: 1 }
        }
      }
    ]);

    const requestsByStatus = await ServiceRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const requestsByProvince = await ServiceRequest.aggregate([
      {
        $match: {
          province: { $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$province',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // NEW: Get requests by district
    const requestsByDistrict = await ServiceRequest.aggregate([
      {
        $match: {
          district: { $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$district',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // NEW: Get requests over time
    const requestsByTime = await getRequestsOverTime();

    // NEW: Get top performing regions and services
    const topPerforming = await getTopPerformingData();

    res.json({
      serviceRequestsByType,
      requestsByStatus,
      requestsByProvince,
      requestsByDistrict,
      requestsByTime,
      topPerforming
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};