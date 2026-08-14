import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'test') {
  dotenv.config();
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const config = {
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
  port: parseInt(optionalEnv('PORT', '5001'), 10),
  isProduction: process.env.NODE_ENV === 'production',

  databaseUrl: requireEnv('DATABASE_URL'),

  jwt: {
    accessSecret: requireEnv('JWT_ACCESS_SECRET'),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
    accessExpiresIn: optionalEnv('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: optionalEnv('JWT_REFRESH_EXPIRES_IN', '30d'),
  },

  corsOrigins: optionalEnv('CORS_ORIGINS', 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim()),

  gps: {
    maxAccuracyMeters: parseInt(optionalEnv('GPS_MAX_ACCURACY_METERS', '50'), 10),
    approachingMeters: parseInt(optionalEnv('GEOFENCE_APPROACHING_METERS', '500'), 10),
  },

  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',

  aws: {
    region: process.env.AWS_REGION ?? '',
    s3Bucket: process.env.AWS_S3_BUCKET ?? '',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID ?? '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') ?? '',
  },
} as const;
