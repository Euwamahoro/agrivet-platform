module.exports = (sequelize, DataTypes) => {
  const ServiceRequest = sequelize.define(
    'ServiceRequest',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      farmerId: {
        
        type: DataTypes.UUID,
        allowNull: false,
        field: 'farmer_id',
        references: {
          model: 'farmers',
          key: 'id'
        }
      },
      graduateId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'graduate_id',
        references: {
          model: 'graduates',
          key: 'id'
        }
      },
      serviceType: {
        type: DataTypes.ENUM('agronomy', 'veterinary'),
        allowNull: false,
        field: 'service_type'
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'assigned', 'in_progress', 'completed', 'cancelled'),
        defaultValue: 'pending',
      },
      location: {
        type: DataTypes.GEOMETRY('Point', 4326),
        allowNull: true,
      },
    },
    {
      tableName: 'service_requests',
      underscored: true,
    }
  );

  ServiceRequest.associate = (models) => {
    ServiceRequest.belongsTo(models.Farmer, {
      foreignKey: 'farmer_id',
      as: 'farmer'
    });
    ServiceRequest.belongsTo(models.Graduate, {
      foreignKey: 'graduate_id',
      as: 'graduate'
    });
  };

  return ServiceRequest;
};