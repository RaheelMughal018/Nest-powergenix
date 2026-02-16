import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3333', 10),
  name: process.env.APP_NAME || 'Auth Course API',
  url: process.env.APP_URL || 'http://localhost:3333',
}));
