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
      location: {
        type: DataTypes.GEOMETRY('Point', 4326),
        allowNull: false,
      },
      isAvailable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_available'
      },
    },
    {
      tableName: 'graduates',
      underscored: true,
    }
  );

  Graduate.associate = (models) => {
    // A graduate can handle multiple service requests
    Graduate.hasMany(models.ServiceRequest, {
      foreignKey: 'graduate_id',
      as: 'serviceRequests'
    });
  };

  return Graduate;
};