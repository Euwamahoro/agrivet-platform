module.exports = (sequelize, DataTypes) => {
  const Graduate = sequelize.define(
    'Graduate',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'phone_number'
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      expertise: {
        type: DataTypes.ENUM('agronomy', 'veterinary', 'both'),
        allowNull: false,
      },
      // NEW: Add location administrative fields for filtering
      province: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      district: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      sector: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      cell: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // PostGIS location for spatial queries
      location: {
        type: DataTypes.GEOMETRY('Point', 4326),
        allowNull: false,
      },
      isAvailable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_available'
      },
      // NEW: Explicit timestamp fields with correct mapping
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at'
      },
    },
    {
      tableName: 'graduates',
      underscored: true,
    }
  );

  Graduate.associate = (models) => {
    Graduate.hasMany(models.ServiceRequest, {
      foreignKey: 'graduate_id',
      as: 'assignedRequests'
    });
  };

  return Graduate;
};