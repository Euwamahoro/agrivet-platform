module.exports = (sequelize, DataTypes) => {
  const Farmer = sequelize.define(
    'Farmer',
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
        field: 'phone_number' // Use snake_case for database columns
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      locationText: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'location_text'
      },
    },
    {
      tableName: 'farmers',
      underscored: true, // Automatically convert camelCase to snake_case
    }
  );

  Farmer.associate = (models) => {
    // A farmer can have multiple service requests
    Farmer.hasMany(models.ServiceRequest, {
      foreignKey: 'farmer_id',
      as: 'serviceRequests'
    });
  };

  return Farmer;
};