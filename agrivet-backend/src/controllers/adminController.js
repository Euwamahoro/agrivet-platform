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

exports.getAnalytics = async (req, res) => {
  try {
    // ==== OVERVIEW KPIs ====
    const totalRequests = await ServiceRequest.countDocuments();
    const completedRequests = await ServiceRequest.countDocuments({ status: 'completed' });
    const activeRequests = await ServiceRequest.countDocuments({ 
      status: { $in: ['pending', 'assigned', 'in_progress'] } 
    });
    
    const completionRate = totalRequests > 0 
      ? ((completedRequests / totalRequests) * 100).toFixed(1) 
      : 0;

    // Calculate average response time (time from pending to assigned)
    const assignedRequests = await ServiceRequest.find({ 
      status: { $in: ['assigned', 'in_progress', 'completed'] },
      updatedAt: { $exists: true }
    }).select('createdAt updatedAt');
    
    let avgResponseTime = 0;
    if (assignedRequests.length > 0) {
      const totalTime = assignedRequests.reduce((sum, req) => {
        const timeDiff = new Date(req.updatedAt) - new Date(req.createdAt);
        return sum + timeDiff;
      }, 0);
      avgResponseTime = Math.round(totalTime / assignedRequests.length / (1000 * 60 * 60)); // in hours
    }

    // Get last month's data for trend calculation
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthRequests = await ServiceRequest.countDocuments({
      createdAt: { $gte: lastMonth }
    });
    
    const requestTrend = totalRequests > 0 && lastMonthRequests > 0
      ? (((lastMonthRequests - totalRequests) / totalRequests) * 100).toFixed(1)
      : 0;

    // ==== SERVICE DISTRIBUTION ====
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

    // Completion rate by service type
    const completionByType = await ServiceRequest.aggregate([
      {
        $group: {
          _id: '$serviceType',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 1,
          total: 1,
          completed: 1,
          completionRate: {
            $multiply: [
              { $divide: ['$completed', '$total'] },
              100
            ]
          }
        }
      }
    ]);

    // ==== REGIONAL PERFORMANCE ====
    // Fix null provinces by looking up from farmer data
    const requestsByProvince = await ServiceRequest.aggregate([
      {
        $lookup: {
          from: 'farmers',
          localField: 'farmer',
          foreignField: '_id',
          as: 'farmerData'
        }
      },
      {
        $unwind: {
          path: '$farmerData',
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $group: {
          _id: '$farmerData.province',
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          _id: { $ne: null, $ne: '' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const requestsByDistrict = await ServiceRequest.aggregate([
      {
        $lookup: {
          from: 'farmers',
          localField: 'farmer',
          foreignField: '_id',
          as: 'farmerData'
        }
      },
      {
        $unwind: {
          path: '$farmerData',
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $group: {
          _id: {
            province: '$farmerData.province',
            district: '$farmerData.district'
          },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          '_id.district': { $ne: null, $ne: '' }
        }
      },
      {
        $project: {
          _id: '$_id.district',
          province: '$_id.province',
          count: 1
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Top performing regions
    const topProvince = requestsByProvince[0] || { _id: 'N/A', count: 0 };
    const topDistrict = requestsByDistrict[0] || { _id: 'N/A', count: 0 };
    const topServiceType = serviceRequestsByType.sort((a, b) => b.count - a.count)[0] || { _id: 'N/A', count: 0 };

    // ==== TIME TRENDS ====
    const now = new Date();
    
    // Daily requests (last 7 days)
    const dailyRequests = await ServiceRequest.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Weekly requests (last 8 weeks)
    const weeklyRequests = await ServiceRequest.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            $week: '$createdAt'
          },
          year: { $first: { $year: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { year: 1, _id: 1 }
      },
      {
        $project: {
          _id: 0,
          week: { $concat: [{ $toString: '$year' }, '-W', { $toString: '$_id' }] },
          count: 1
        }
      }
    ]);

    // Monthly requests (last 12 months)
    const monthlyRequests = await ServiceRequest.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // ==== USER INSIGHTS ====
    const totalFarmers = await Farmer.countDocuments();
    const totalGraduates = await Graduate.countDocuments();
    
    // Active farmers (those with requests)
    const activeFarmers = await ServiceRequest.distinct('farmer');
    const activeFarmerCount = activeFarmers.length;
    
    // Active graduates (those assigned to requests)
    const activeGraduates = await ServiceRequest.distinct('graduate', {
      graduate: { $ne: null }
    });
    const activeGraduateCount = activeGraduates.length;

    // New registrations (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const newFarmers = await Farmer.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    const newGraduates = await Graduate.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Service usage by farmers
    const serviceUsagePatterns = await ServiceRequest.aggregate([
      {
        $group: {
          _id: '$farmer',
          requestCount: { $sum: 1 },
          serviceTypes: { $addToSet: '$serviceType' }
        }
      },
      {
        $group: {
          _id: '$requestCount',
          farmerCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // ==== RESPONSE OBJECT ====
    res.json({
      // Overview KPIs
      overview: {
        totalRequests,
        completionRate: parseFloat(completionRate),
        activeRequests,
        avgResponseTime,
        requestTrend: parseFloat(requestTrend)
      },
      
      // Service Distribution
      serviceDistribution: {
        byType: serviceRequestsByType,
        byStatus: requestsByStatus,
        completionByType
      },
      
      // Regional Performance
      regionalPerformance: {
        byProvince: requestsByProvince,
        byDistrict: requestsByDistrict,
        topPerforming: {
          bestProvince: { name: topProvince._id, count: topProvince.count },
          bestDistrict: { name: topDistrict._id, count: topDistrict.count },
          highestServiceType: { name: topServiceType._id, count: topServiceType.count }
        }
      },
      
      // Time Trends
      timeTrends: {
        daily: dailyRequests.map(d => ({ date: d._id, count: d.count })),
        weekly: weeklyRequests,
        monthly: monthlyRequests.map(m => ({ month: m._id, count: m.count }))
      },
      
      // User Insights
      userInsights: {
        farmers: {
          total: totalFarmers,
          active: activeFarmerCount,
          new: newFarmers,
          activityRate: totalFarmers > 0 ? ((activeFarmerCount / totalFarmers) * 100).toFixed(1) : 0
        },
        graduates: {
          total: totalGraduates,
          active: activeGraduateCount,
          new: newGraduates,
          utilizationRate: totalGraduates > 0 ? ((activeGraduateCount / totalGraduates) * 100).toFixed(1) : 0
        },
        serviceUsagePatterns
      },
      
      // Legacy fields for backward compatibility
      serviceRequestsByType,
      requestsByStatus,
      requestsByProvince
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

// Keep other existing functions
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