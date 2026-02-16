import { registerAs } from '@nestjs/config';

export default registerAs('swagger', () => ({
  title: process.env.SWAGGER_TITLE || 'Power Genix API',
  description: process.env.SWAGGER_DESCRIPTION || 'Power Genix API Documentation',
  version: process.env.SWAGGER_VERSION || '1.0',
  path: process.env.SWAGGER_PATH || 'docs',
}));
