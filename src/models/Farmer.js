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
        field: 'phone_number', // Use snake_case for database columns
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      // New fields for structured location
      province: {
        type: DataTypes.STRING,
        allowNull: true, // Allow null initially if registration doesn't complete all steps
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
      // Keep locationText for potential descriptive input if structured isn't fully captured, or for legacy.
      locationText: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'location_text',
      },
      // We will add the GEOMETRY('Point', 4326) type in a later phase
      // once we implement geocoding from these administrative divisions.
      // location: {
      //   type: DataTypes.GEOMETRY('Point', 4326),
      //   allowNull: true,
      // },
    },
    {
      tableName: 'farmers',
    }
  );

  Farmer.associate = (models) => {
    // A farmer can have multiple service requests
    Farmer.hasMany(models.ServiceRequest, {
      foreignKey: 'farmer_id',
      as: 'serviceRequests',
    });
  };

  return Farmer;
};