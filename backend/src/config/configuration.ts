export default () => {
  let dbHost = process.env.DATABASE_HOST || 'localhost';
  let dbPort = parseInt(process.env.DATABASE_PORT, 10) || 5432;
  let dbUsername = process.env.DATABASE_USERNAME;
  let dbPassword = process.env.DATABASE_PASSWORD;
  let dbName = process.env.DATABASE_NAME;
  let dbSsl = process.env.DATABASE_SSL === 'true';

  if (process.env.DATABASE_URL) {
    try {
      const parsed = new URL(process.env.DATABASE_URL);
      dbHost = parsed.hostname;
      dbPort = parseInt(parsed.port, 10) || 5432;
      dbUsername = decodeURIComponent(parsed.username);
      dbPassword = decodeURIComponent(parsed.password);
      dbName = parsed.pathname.replace(/^\//, '');
      if (parsed.searchParams.get('sslmode') === 'require' || parsed.searchParams.get('ssl') === 'true') {
        dbSsl = true;
      }
    } catch (err) {
      console.warn('Could not parse DATABASE_URL, using fallback config:', err);
    }
  }

  let redisHost = process.env.REDIS_HOST || 'localhost';
  let redisPort = parseInt(process.env.REDIS_PORT, 10) || 6379;
  let redisPassword = process.env.REDIS_PASSWORD;

  if (process.env.REDIS_URL) {
    try {
      const parsedRedis = new URL(process.env.REDIS_URL);
      redisHost = parsedRedis.hostname;
      redisPort = parseInt(parsedRedis.port, 10) || 6379;
      if (parsedRedis.password) {
        redisPassword = decodeURIComponent(parsedRedis.password);
      }
    } catch (err) {
      // ignore
    }
  }

  return {
    port: parseInt(process.env.PORT, 10) || 3000,
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    
    database: {
      host: dbHost,
      port: dbPort,
      username: dbUsername,
      password: dbPassword,
      name: dbName,
      ssl: dbSsl,
      replicaHost: process.env.DATABASE_REPLICA_HOST || dbHost,
      replicaPort: parseInt(process.env.DATABASE_REPLICA_PORT, 10) || dbPort,
      replicaUsername: process.env.DATABASE_REPLICA_USERNAME || dbUsername,
      replicaPassword: process.env.DATABASE_REPLICA_PASSWORD || dbPassword,
    },
    
    redis: {
      host: redisHost,
      port: redisPort,
      password: redisPassword,
    },
    
    jwt: {
      secret: process.env.JWT_SECRET,
      expiration: process.env.JWT_EXPIRATION || '24h',
      refreshSecret: process.env.JWT_REFRESH_SECRET,
      refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    },
    
    otp: {
      expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 10,
      length: parseInt(process.env.OTP_LENGTH, 10) || 6,
    },
    
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      currency: process.env.STRIPE_CURRENCY || 'inr',
    },
    
    razorpay: {
      keyId: process.env.RAZORPAY_KEY_ID,
      keySecret: process.env.RAZORPAY_KEY_SECRET,
    },
    
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    },
    
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    },
    
    googleMaps: {
      apiKey: process.env.GOOGLE_MAPS_API_KEY,
    },
    
    kafka: {
      broker: process.env.KAFKA_BROKER || 'localhost:9092',
      clientId: process.env.KAFKA_CLIENT_ID || 'travel-saas-backend',
    },
    
    email: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.FROM_EMAIL || 'noreply@travelsaas.com',
    },
    
    upload: {
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5242880,
      path: process.env.UPLOAD_PATH || './uploads',
    },
    
    throttle: {
      ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
      limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
    },
    
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      filePath: process.env.LOG_FILE_PATH || './logs',
    },
  };
};
