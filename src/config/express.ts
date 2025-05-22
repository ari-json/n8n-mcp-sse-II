/**
 * Express Configuration
 * 
 * This module configures the Express application used by Supergateway
 * with Basic Authentication for the /sse and /message endpoints.
 */

import express from 'express';
import basicAuth from 'express-basic-auth';
import { getEnvConfig } from './environment.js';

/**
 * Configure Express with Basic Authentication middleware
 * for the /sse and /message endpoints
 * 
 * @returns Configured Express application
 */
export function configureExpress(): express.Express {
  const app = express();
  const { n8nApiKey, n8nWebhookUsername } = getEnvConfig();
  
  // Apply Basic Authentication to /sse and /message endpoints
  const users: Record<string, string> = {};
  users[n8nWebhookUsername] = n8nApiKey;
  
  app.use(
    ['/sse', '/message'],
    basicAuth({
      users,
      challenge: true,
    })
  );
  
  return app;
} 