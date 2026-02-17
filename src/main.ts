import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { LoggerService } from './common/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Get services
  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);
  logger.setContext('Bootstrap');

  // Enable cookie parser
  app.use(cookieParser());

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle(configService.get<string>('swagger.title') || 'Power Genix API')
    .setDescription(
      configService.get<string>('swagger.description') || 'Authentication API Documentation',
    )
    .setVersion(configService.get<string>('swagger.version') || '1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(configService.get<string>('swagger.path') || 'api/docs', app, document, {
    customSiteTitle: configService.get<string>('swagger.title') || 'Power Genix API',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

      /* Reset & Base - Full dark theme */
      .swagger-ui .topbar { display: none }
      html, body { background: #0c0c0f !important; margin: 0; color: #e4e4e7; }
      body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; }
      .swagger-ui { background: #0c0c0f; color: #e4e4e7; padding: 0 0 4rem; }
      .swagger-ui * { box-sizing: border-box; }

      /* Custom scrollbar */
      .swagger-ui ::-webkit-scrollbar { width: 8px; height: 8px; }
      .swagger-ui ::-webkit-scrollbar-track { background: #131316; border-radius: 4px; }
      .swagger-ui ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
      .swagger-ui ::-webkit-scrollbar-thumb:hover { background: #52525b; }

      /* Info / Hero Section - Enhanced */
      .swagger-ui .info {
        margin: 0; padding: 3.5rem 2.5rem;
        background: linear-gradient(135deg, #131316 0%, #0f0f12 50%, #0c0c0f 100%);
        border: 1px solid #1e1e24; border-radius: 16px;
        margin-bottom: 2.5rem;
        position: relative; overflow: hidden;
        box-shadow: 0 4px 24px rgba(0,0,0,0.4);
      }
      .swagger-ui .info::before {
        content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
        background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
        opacity: 0.6;
      }
      .swagger-ui .info .title { font-size: 2.25rem; font-weight: 700; color: #fafafa; letter-spacing: -0.03em; margin: 0 0 0.75rem; line-height: 1.2; }
      .swagger-ui .info .title small { background: linear-gradient(135deg, #27272a 0%, #1e1e24 100%); color: #a1a1aa; padding: 0.35rem 0.85rem; border-radius: 8px; font-size: 0.8125rem; font-weight: 600; margin-left: 0.75rem; border: 1px solid #27272a; }
      .swagger-ui .info .description p, .swagger-ui .info .description span { color: #a1a1aa; line-height: 1.7; font-size: 0.9375rem; }
      .swagger-ui .info a { color: #60a5fa; text-decoration: none; transition: color 0.15s, text-decoration 0.15s; }
      .swagger-ui .info a:hover { color: #93c5fd; text-decoration: underline; }

      /* Section Headers - Enhanced */
      .swagger-ui .opblock-tag {
        font-size: 1.25rem; font-weight: 600; color: #fafafa;
        border-color: #1e1e24; border-bottom-width: 2px;
        padding: 1.25rem 0; margin: 2.5rem 0 1rem;
        position: relative; transition: color 0.2s;
      }
      .swagger-ui .opblock-tag::after {
        content: ''; position: absolute; bottom: -2px; left: 0; width: 48px; height: 2px;
        background: linear-gradient(90deg, #3b82f6, transparent);
        border-radius: 2px;
      }
      .swagger-ui .opblock-tag:hover { color: #fafafa; }
      .swagger-ui .opblock-tag-section { margin: 0 0 1.5rem; }

      /* Operation Blocks - Cards (Enhanced) */
      .swagger-ui .opblock {
        border: 1px solid #1e1e24; border-radius: 12px; margin-bottom: 0.875rem;
        overflow: hidden; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .swagger-ui .opblock:hover { border-color: #27272a; box-shadow: 0 8px 24px rgba(0,0,0,0.35); transform: translateY(-1px); }
      .swagger-ui .opblock.opblock-open { border-color: #27272a; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
      .swagger-ui .opblock .opblock-summary-method {
        font-size: 0.6875rem; font-weight: 700; padding: 0.4rem 0.65rem;
        border-radius: 8px; min-width: 4.25rem; text-align: center;
        letter-spacing: 0.05em; text-transform: uppercase;
      }
      .swagger-ui .opblock.opblock-get { border-left: 4px solid #3b82f6; }
      .swagger-ui .opblock.opblock-get .opblock-summary-method { background: rgba(59,130,246,0.25); color: #60a5fa; box-shadow: 0 0 12px rgba(59,130,246,0.15); }
      .swagger-ui .opblock.opblock-post { border-left: 4px solid #22c55e; }
      .swagger-ui .opblock.opblock-post .opblock-summary-method { background: rgba(34,197,94,0.25); color: #4ade80; box-shadow: 0 0 12px rgba(34,197,94,0.15); }
      .swagger-ui .opblock.opblock-put { border-left: 4px solid #f59e0b; }
      .swagger-ui .opblock.opblock-put .opblock-summary-method { background: rgba(245,158,11,0.25); color: #fbbf24; box-shadow: 0 0 12px rgba(245,158,11,0.15); }
      .swagger-ui .opblock.opblock-delete { border-left: 4px solid #ef4444; }
      .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: rgba(239,68,68,0.25); color: #f87171; box-shadow: 0 0 12px rgba(239,68,68,0.15); }
      .swagger-ui .opblock .opblock-summary-path { font-weight: 600; color: #f4f4f5; font-size: 1rem; font-family: 'JetBrains Mono', monospace; letter-spacing: -0.01em; }
      .swagger-ui .opblock .opblock-summary-description { color: #71717a; font-size: 0.875rem; }
      .swagger-ui .opblock-summary { padding: 1.125rem 1.5rem; background: #131316; border: none; cursor: pointer; transition: background 0.2s; }
      .swagger-ui .opblock-summary:hover { background: #16161a; }

      /* Expanded Body */
      .swagger-ui .opblock-body { background: #16161a; border-top: 1px solid #1e1e24; animation: opblock-expand 0.2s ease-out; }
      @keyframes opblock-expand { from { opacity: 0.95; } to { opacity: 1; } }
      .swagger-ui .opblock-section-header { background: #1a1a1e !important; color: #fafafa; border: none; padding: 0.75rem 1.25rem; }
      .swagger-ui .opblock-section-header label { color: #fafafa; font-weight: 500; }
      .swagger-ui .opblock-section-header .btn { color: #60a5fa; border-color: #3f3f46; background: transparent; transition: all 0.15s; }
      .swagger-ui .opblock-section-header .btn:hover { background: rgba(96,165,250,0.1); }

      /* Tables - Enhanced */
      .swagger-ui table { border-radius: 10px; overflow: hidden; border: 1px solid #1e1e24; }
      .swagger-ui table thead tr th { border-color: #1e1e24; color: #71717a; background: #131316 !important; font-weight: 600; font-size: 0.75rem; padding: 0.875rem 1.25rem; text-transform: uppercase; letter-spacing: 0.05em; }
      .swagger-ui table tbody tr td { border-color: #1e1e24; color: #e4e4e7; padding: 0.875rem 1.25rem; font-size: 0.875rem; transition: background 0.15s; }
      .swagger-ui table tbody tr { background: #16161a; }
      .swagger-ui table tbody tr:nth-child(2n) { background: #131316; }
      .swagger-ui table tbody tr:hover td { background: #1a1a1e !important; }

      /* Models / Schemas */
      .swagger-ui .model { color: #e4e4e7; }
      .swagger-ui .model-box { background: #131316; border: 1px solid #1e1e24; border-radius: 8px; padding: 1rem; }
      .swagger-ui .model-box-control { color: #71717a; font-size: 0.875rem; }
      .swagger-ui .prop-type { color: #60a5fa; font-weight: 500; }
      .swagger-ui .prop-name { color: #34d399; }
      .swagger-ui .prop-format { color: #a78bfa; font-size: 0.8125rem; }
      .swagger-ui .prop-enum { color: #fbbf24; }

      /* Parameters */
      .swagger-ui .parameter__name { color: #f4f4f5; font-weight: 500; }
      .swagger-ui .parameter__type { color: #60a5fa; font-size: 0.8125rem; }
      .swagger-ui .parameter__in { color: #71717a; font-size: 0.75rem; }

      /* Responses - Status color coding */
      .swagger-ui .response-col_status { font-weight: 600; font-family: 'JetBrains Mono', monospace; }
      .swagger-ui .response .response-col_status:not([data-code]) { color: #e4e4e7; }
      .swagger-ui .response[data-code^="2"] .response-col_status { color: #4ade80; }
      .swagger-ui .response[data-code^="3"] .response-col_status { color: #fbbf24; }
      .swagger-ui .response[data-code^="4"] .response-col_status { color: #f87171; }
      .swagger-ui .response[data-code^="5"] .response-col_status { color: #f87171; }
      .swagger-ui .response-col_description { color: #a1a1aa; }
      .swagger-ui .responses-inner { padding: 1.5rem; background: #131316 !important; border: 1px solid #1e1e24; border-radius: 10px; margin-top: 0.75rem; box-shadow: inset 0 1px 0 rgba(255,255,255,0.02); }

      /* Tabs - Enhanced */
      .swagger-ui .tab { border-color: #1e1e24; margin: 0; }
      .swagger-ui .tab li { color: #71717a; padding: 0.75rem 1.25rem; transition: all 0.2s; border-bottom: 2px solid transparent; }
      .swagger-ui .tab li:hover { color: #a1a1aa; }
      .swagger-ui .tab li.active { color: #60a5fa; border-bottom-color: #60a5fa; font-weight: 600; }

      /* Buttons */
      .swagger-ui .btn.execute { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border: none; color: #fff; font-weight: 500; padding: 0.5rem 1.25rem; border-radius: 8px; transition: all 0.2s; box-shadow: 0 2px 8px rgba(59,130,246,0.3); }
      .swagger-ui .btn.execute:hover { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59,130,246,0.4); }
      .swagger-ui .btn.cancel { color: #71717a; border: 1px solid #27272a; background: transparent; border-radius: 8px; transition: all 0.15s; }
      .swagger-ui .btn.cancel:hover { color: #a1a1aa; border-color: #3f3f46; background: #1a1a1e; }

      /* Form Inputs */
      .swagger-ui select, .swagger-ui input[type=text], .swagger-ui textarea { border: 1px solid #27272a; background: #131316; color: #f4f4f5; border-radius: 8px; padding: 0.5rem 0.75rem; transition: border-color 0.15s; }
      .swagger-ui select:focus, .swagger-ui input[type=text]:focus, .swagger-ui textarea:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
      .swagger-ui textarea { min-height: 80px; resize: vertical; }

      /* Code Blocks - Enhanced */
      .swagger-ui .highlight-code {
        background: #08080a !important; border: 1px solid #1e1e24;
        border-radius: 10px; padding: 1.25rem !important;
        box-shadow: inset 0 2px 8px rgba(0,0,0,0.3);
      }
      .swagger-ui .microlight {
        color: #e4e4e7 !important; font-family: 'JetBrains Mono', 'Fira Code', monospace;
        font-size: 0.8125rem; line-height: 1.7; letter-spacing: 0.02em;
      }

      /* Auth */
      .swagger-ui .scheme-container { background: #131316; border: 1px solid #1e1e24; border-radius: 10px; padding: 1.25rem; margin: 1.5rem 0; }
      .swagger-ui .scheme-container .schemes-title { color: #71717a; font-weight: 500; }
      .swagger-ui .auth-container { background: #131316; border: 1px solid #1e1e24; border-radius: 8px; }
      .swagger-ui .auth-wrapper { color: #e4e4e7; }
      .swagger-ui .authorization__btn { color: #60a5fa; font-weight: 500; }

      /* Modals, dialogs, overlays */
      .swagger-ui .dialog-ux .modal-ux { background: #131316; border: 1px solid #1e1e24; border-radius: 12px; }
      .swagger-ui .dialog-ux .modal-ux-header { background: #16161a; border-color: #1e1e24; color: #fafafa; }
      .swagger-ui .dialog-ux .modal-ux-content { background: #131316; color: #e4e4e7; }
      .swagger-ui .dialog-ux .modal-ux-backdrop { background: rgba(0,0,0,0.7); }
      .swagger-ui .copy-to-clipboard { background: #27272a; border-color: #3f3f46; color: #a1a1aa; }
      .swagger-ui .copy-to-clipboard:hover { background: #3f3f46; color: #e4e4e7; }
      .swagger-ui .download-contents { background: #27272a; border-color: #3f3f46; color: #e4e4e7; }
      .swagger-ui .download-contents:hover { background: #3f3f46; }
      .swagger-ui .btn-group .btn { background: #27272a; border-color: #3f3f46; color: #e4e4e7; }
      .swagger-ui .btn-group .btn:hover { background: #3f3f46; }
      .swagger-ui .try-out__btn { color: #60a5fa; border-color: #3f3f46; }
      .swagger-ui .try-out__btn:hover { background: rgba(96,165,250,0.1); }
      .swagger-ui .opblock-description-wrapper, .swagger-ui .opblock-external-docs-wrapper { color: #a1a1aa; }
      .swagger-ui .opblock-description p, .swagger-ui .opblock-external-docs-wrapper p { color: #a1a1aa; }
      .swagger-ui .markdown p, .swagger-ui .renderedMarkdown p { color: #a1a1aa; }
      .swagger-ui .parameter__extension, .swagger-ui .parameter__deprecated { color: #f87171; }
      .swagger-ui .prop-attr { color: #71717a; }
      .swagger-ui .model-toggle { color: #60a5fa; }
      .swagger-ui .model-toggle:hover { color: #93c5fd; }
      .swagger-ui .model-toggle.collapsed { color: #71717a; }
      .swagger-ui .opblock-summary-control svg { fill: #71717a; }
      .swagger-ui .opblock.opblock-open .opblock-summary-control svg { fill: #e4e4e7; }
      .swagger-ui .responses-table td { background: transparent !important; }
      .swagger-ui .response .response-col_status { font-family: 'JetBrains Mono', monospace; }
      .swagger-ui .curl-command { background: #08080a; border: 1px solid #1e1e24; border-radius: 10px; padding: 1rem 1.25rem; }

      /* Loading - Enhanced */
      .swagger-ui .loading-container { background: #0c0c0f; }
      .swagger-ui .loading-container .loading::before {
        border-color: #3b82f6 transparent transparent;
        animation: swagger-spin 0.8s linear infinite;
      }
      @keyframes swagger-spin { to { transform: rotate(360deg); } }

      /* Typography */
      .swagger-ui h1, .swagger-ui h2, .swagger-ui h3, .swagger-ui h4 { color: #fafafa; font-weight: 600; }
      .swagger-ui a { color: #60a5fa; text-decoration: none; transition: color 0.15s; }
      .swagger-ui a:hover { color: #93c5fd; }

      /* Wrapper & Layout */
      .swagger-ui .wrapper { padding: 2.5rem; max-width: 1460px; margin: 0 auto; }
      .swagger-ui .info .link { color: #60a5fa; }
      .swagger-ui .opblock-tag-section { padding-left: 0; }

      /* Lock / Auth badge */
      .swagger-ui .opblock-summary .authorization__btn { color: #fbbf24; }
      .swagger-ui .opblock-summary .authorization__btn.locked { color: #fbbf24; }
      .swagger-ui .opblock-summary .authorization__btn.unlocked { color: #4ade80; }
      .swagger-ui svg.locked { fill: #fbbf24; }
      .swagger-ui svg.unlocked { fill: #4ade80; }

      /* Selection & Focus */
      .swagger-ui ::selection { background: rgba(59,130,246,0.3); color: #fafafa; }
      .swagger-ui *:focus-visible { outline: 2px solid #3b82f6; outline-offset: 2px; }

      /* Model box expand animation */
      .swagger-ui .model-box { transition: all 0.2s ease; }
      .swagger-ui .model-box:hover { border-color: #27272a; }

      /* Server URL & schemes */
      .swagger-ui .servers > label { color: #71717a; font-weight: 500; }
      .swagger-ui .servers .servers-title { color: #a1a1aa; }
      .swagger-ui .servers h4 { color: #fafafa; }
   `,
  });

  const port = configService.get<number>('app.port') || 3333;
  const appName = configService.get<string>('app.name') || 'Power Genix API';
  const nodeEnv = configService.get<string>('app.nodeEnv') || 'development';

  await app.listen(port);

  logger.log(`${appName} is running in ${nodeEnv} mode`);
  logger.log(`Application is running on: http://localhost:${port}`);
}

void bootstrap();
