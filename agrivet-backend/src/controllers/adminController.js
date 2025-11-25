// src/controllers/adminController.js
const User = require('../models/User');
const Graduate = require('../models/Graduate');
const Farmer = require('../models/Farmer');
const ServiceRequest = require('../models/serviceRequest');

// ... keep all your existing functions (getPlatformStats, getUsers, etc.) ...

exports.getAnalytics = async (req, res) => {
  try {
    // Execute all analytics queries in parallel for better performance
    const [
      serviceRequestsByType,
      requestsByStatus,
      requestsByProvince,
      requestsByDistrict,
      requestsByTime,
      topPerforming,
      platformKPIs,
      userStatistics
    ] = await Promise.all([
      getServiceRequestsByType(),
      getRequestsByStatus(),
      getRequestsByProvince(),
      getRequestsByDistrict(),
      getRequestsOverTime(),
      getTopPerformingData(),
      getPlatformKPIs(),
      getUserStatistics()
    ]);

    res.json({
      // Overview KPIs
      platformKPIs,
      
      // Service Metrics
      serviceRequestsByType,
      requestsByStatus,
      
      // Regional Distribution
      requestsByProvince,
      requestsByDistrict,
      topPerforming,
      
      // Time-based Trends
      requestsByTime,
      
      // User Statistics
      userStatistics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

// Helper function for Service Requests by Type
async function getServiceRequestsByType() {
  return await ServiceRequest.aggregate([
    {
      $group: {
        _id: '$serviceType',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
}

// Helper function for Requests by Status
async function getRequestsByStatus() {
  return await ServiceRequest.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
}

// Helper function for Requests by Province (with null handling)
async function getRequestsByProvince() {
  return await ServiceRequest.aggregate([
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
}

// Helper function for Requests by District
async function getRequestsByDistrict() {
  return await ServiceRequest.aggregate([
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
    { $limit: 10 } // Top 10 districts only
  ]);
}

// Helper function for Platform KPIs
async function getPlatformKPIs() {
  const totalRequests = await ServiceRequest.countDocuments();
  const completedRequests = await ServiceRequest.countDocuments({ status: 'completed' });
  const activeRequests = await ServiceRequest.countDocuments({ 
    status: { $in: ['pending', 'assigned', 'in_progress'] } 
  });
  
  // Calculate completion rate (avoid division by zero)
  const completionRate = totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0;
  
  // Calculate average resolution time (in days)
  const resolutionStats = await ServiceRequest.aggregate([
    {
      $match: {
        status: 'completed',
        createdAt: { $exists: true },
        updatedAt: { $exists: true }
      }
    },
    {
      $project: {
        resolutionTime: {
          $divide: [
            { $subtract: ['$updatedAt', '$createdAt'] },
            1000 * 60 * 60 * 24 // Convert to days
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        avgResolutionTime: { $avg: '$resolutionTime' }
      }
    }
  ]);

  const avgResolutionTime = resolutionStats.length > 0 ? resolutionStats[0].avgResolutionTime : 0;

  // Get this week vs last week growth
  const now = new Date();
  const startOfThisWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  const thisWeekRequests = await ServiceRequest.countDocuments({
    createdAt: { $gte: startOfThisWeek }
  });

  const lastWeekRequests = await ServiceRequest.countDocuments({
    createdAt: { 
      $gte: startOfLastWeek,
      $lt: startOfThisWeek
    }
  });

  const weeklyGrowth = lastWeekRequests > 0 
    ? ((thisWeekRequests - lastWeekRequests) / lastWeekRequests) * 100 
    : 0;

  return {
    totalRequests,
    completedRequests,
    activeRequests,
    completionRate: Math.round(completionRate),
    avgResolutionTime: Math.round(avgResolutionTime * 10) / 10, // 1 decimal place
    weeklyGrowth: Math.round(weeklyGrowth * 10) / 10
  };
}

// Helper function for Top Performing Data
async function getTopPerformingData() {
  // Get best province
  const [bestProvinceResult, bestDistrictResult, highestServiceTypeResult] = await Promise.all([
    ServiceRequest.aggregate([
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
    ]),
    ServiceRequest.aggregate([
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
    ]),
    ServiceRequest.aggregate([
      {
        $group: {
          _id: '$serviceType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ])
  ]);

  return {
    bestProvince: bestProvinceResult.length > 0 ? {
      name: bestProvinceResult[0]._id,
      count: bestProvinceResult[0].count
    } : { name: 'No data', count: 0 },
    
    bestDistrict: bestDistrictResult.length > 0 ? {
      name: bestDistrictResult[0]._id,
      count: bestDistrictResult[0].count
    } : { name: 'No data', count: 0 },
    
    highestServiceType: highestServiceTypeResult.length > 0 ? {
      name: highestServiceTypeResult[0]._id,
      count: highestServiceTypeResult[0].count
    } : { name: 'No data', count: 0 }
  };
}

// Helper function for Requests Over Time
async function getRequestsOverTime() {
  const now = new Date();
  
  // Daily data (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const daily = await ServiceRequest.aggregate([
    {
      $match: {
        createdAt: { $gte: sevenDaysAgo }
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
          $dateToString: {
            format: '%Y-%U',
            date: '$createdAt'
          }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        week: '$_id',
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

// Helper function for User Statistics
async function getUserStatistics() {
  const [totalFarmers, totalGraduates, newRegistrationsThisMonth] = await Promise.all([
    Farmer.countDocuments(),
    Graduate.countDocuments(),
    User.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    })
  ]);

  // Calculate active users (users who created service requests this month)
  const activeUsersThisMonth = await ServiceRequest.distinct('farmer', {
    createdAt: {
      $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    }
  });

  return {
    totalFarmers,
    totalGraduates,
    newRegistrationsThisMonth,
    activeUsersThisMonth: activeUsersThisMonth.length
  };
}