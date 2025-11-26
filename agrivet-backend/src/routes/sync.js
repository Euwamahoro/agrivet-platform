// src/routes/sync.js - FIXED SERVICE REQUEST SYNC
// Only showing the service-requests route - keep everything else as is

router.post('/service-requests', async (req, res) => {
  try {
    const { serviceRequests } = req.body;
    
    console.log(`\n🔄 ===== SYNC ROUTE: SERVICE REQUESTS SYNC STARTED =====`);
    console.log(`📥 Received ${serviceRequests?.length || 0} service requests from USSD`);
    console.log('📋 Request body structure:', {
      hasServiceRequests: !!serviceRequests,
      serviceRequestsType: Array.isArray(serviceRequests) ? 'array' : typeof serviceRequests,
      serviceRequestsLength: serviceRequests?.length || 0
    });

    if (!serviceRequests || serviceRequests.length === 0) {
      console.log('❌ No service requests data received in request body');
      return res.json({ 
        success: true, 
        message: 'No service requests to sync',
        data: [] 
      });
    }

    console.log('📋 First service request in request:', serviceRequests[0]);

    const syncedRequests = await Promise.all(
      serviceRequests.map(async (requestData, index) => {
        try {
          console.log(`\n🔄 Processing service request ${index + 1}/${serviceRequests.length}:`, {
            id: requestData.id,
            service_type: requestData.service_type,
            status: requestData.status,
            farmer_phone: requestData.farmerPhone // LOG THIS
          });

          // Check if request already exists
          const existingRequest = await ServiceRequest.findOne({ ussdId: requestData.id });
          if (existingRequest) {
            console.log(`✅ Service request already exists: ${existingRequest._id}`);
            return existingRequest;
          }

          // Find the corresponding farmer in MongoDB by ussdId or phone
          let farmer = await Farmer.findOne({ 
            $or: [
              { ussdId: requestData.farmer_id },
              { phone: requestData.farmerPhone }
            ]
          });

          if (!farmer) {
            console.warn(`❌ No matching farmer found for USSD ID: ${requestData.farmer_id} or phone: ${requestData.farmer_phone}`);
            
            // Try to create a placeholder farmer if none exists
            if (requestData.farmer_phone) {
              console.log(`🔄 Creating placeholder farmer for phone: ${requestData.farmerPhone}`);
              farmer = new Farmer({
                phone: requestData.farmerPhone,
                name: 'Farmer from USSD',
                province: requestData.province || 'Unknown',
                district: requestData.district || 'Unknown',
                sector: requestData.sector || 'Unknown',
                cell: requestData.cell || 'Unknown',
                locationText: `${requestData.province}, ${requestData.district}, ${requestData.sector}, ${requestData.cell}`,
                ussdId: requestData.farmer_id,
                totalRequests: 1,
                completedRequests: 0
              });
              await farmer.save();
              console.log(`✅ Created placeholder farmer: ${farmer._id}`);
            } else {
              console.log('❌ Cannot create farmer - no phone number provided');
              return null;
            }
          }

          console.log(`✅ Found farmer: ${farmer.name} (${farmer.phone})`);

          // Find graduate if assigned
          let graduate = null;
          if (requestData.graduate_phone) {
            graduate = await Graduate.findOne({ 
              phoneNumber: requestData.graduate_phone 
            });
            if (graduate) {
              console.log(`✅ Found graduate: ${graduate.name}`);
            } else {
              console.warn(`⚠️ No graduate found for phone: ${requestData.graduate_phone}`);
            }
          }

          // Create service request in MongoDB with farmer phone and name
          const request = new ServiceRequest({
            farmer: farmer._id,
            graduate: graduate ? graduate._id : undefined,
            // ✅ ADD THESE FIELDS:
            farmerPhone: requestData.farmerPhone || farmer.phone,
            farmerName: farmer.name,
            serviceType: requestData.service_type,
            description: requestData.description,
            status: requestData.status === 'no_match' ? 'pending' : requestData.status,
            location: {
              province: requestData.province,
              district: requestData.district,
              sector: requestData.sector,
              cell: requestData.cell
            },
            ussdId: requestData.id,
            assignedAt: requestData.assigned_at,
            createdAt: requestData.created_at,
            updatedAt: requestData.updated_at
          });

          await request.save();
          console.log(`🎉 Service request created successfully: ${request._id}`);
          console.log(`📝 MongoDB ID: ${request._id}, USSD ID: ${request.ussdId}, Status: ${request.status}, Farmer Phone: ${request.farmerPhone}`);
          return request;
        } catch (error) {
          console.error(`❌ Failed to sync service request ${requestData.id}:`, error.message);
          console.error('🔧 Request sync error details:', error);
          return null;
        }
      })
    );

    // Filter out failed syncs
    const successfulSyncs = syncedRequests.filter(req => req !== null);
    console.log(`\n📊 Service request sync summary:`);
    console.log(`   Total received: ${serviceRequests.length}`);
    console.log(`   Successfully synced: ${successfulSyncs.length}`);
    console.log(`   Failed: ${serviceRequests.length - successfulSyncs.length}`);

    res.json({
      success: true,
      message: `Synced ${successfulSyncs.length} service requests from USSD`,
      data: successfulSyncs
    });
  } catch (error) {
    console.error('❌ Error syncing service requests:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to sync service requests from USSD' 
    });
  }
});