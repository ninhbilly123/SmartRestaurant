import { Sequelize } from 'sequelize';
import env from './env.js';
import logger from './logger.js';

logger.info(`Initializing database connection for ${env.isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}...`);

// Khởi tạo Sequelize
let sequelize;

if (env.isProduction && env.database.url) {
  // Production: Dùng DATABASE_URL
  sequelize = new Sequelize(env.database.url, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,          
        rejectUnauthorized: false 
      }
    },
    logging: false, 
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // Development: Dùng separate credentials
  sequelize = new Sequelize(
    env.database.name,
    env.database.user,
    env.database.password,
    {
      host: env.database.host,
      port: env.database.port,
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

// Test connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connected successfully');
    if (env.isProduction) {
      logger.info('SSL Configuration: require=true, rejectUnauthorized=false');
    } else {
      logger.info(`Connected to: ${env.database.name}@${env.database.host}:${env.database.port}`);
    }
    return sequelize;
  } catch (error) {
    logger.error('Database connection failed:', error.message);
    throw error;
  }
};

export { connectDB };
export default sequelize;
