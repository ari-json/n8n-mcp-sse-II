#!/usr/bin/env node
/**
 * Express Server with Basic Auth for n8n MCP
 * 
 * This file sets up an Express server with Basic Auth middleware
 * for the /sse and /message endpoints, then runs Supergateway.
 */

import express from 'express';
import basicAuth from 'express-basic-auth';
import { spawn } from 'child_process';
import { createServer } from 'http';

// Create Express app
const app = express();

// Get environment variables
const port = process.env.PORT || 8080;
const username = process.env.N8N_WEBHOOK_USERNAME;
const apiKey = process.env.N8N_API_KEY;
const debug = process.env.DEBUG === 'true';

// Validate required environment variables
if (!username || !apiKey) {
  console.error('ERROR: N8N_WEBHOOK_USERNAME and N8N_API_KEY are required');
  process.exit(1);
}

// Configure Basic Auth
const users = {};
users[username] = apiKey;

// Apply Basic Auth middleware to /sse and /message endpoints
app.use(
  ['/sse', '/message'],
  basicAuth({
    users,
    challenge: true,
  })
);

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).send('ok');
});

// Create HTTP server
const server = createServer(app);

// Start server
server.listen(port, () => {
  console.log(`Express server with Basic Auth running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/healthz`);
  console.log(`SSE endpoint: http://localhost:${port}/sse`);
  console.log(`Message endpoint: http://localhost:${port}/message`);
  
  // Now run Supergateway with our Express server
  const supergateway = spawn('npx', [
    '-y',
    'supergateway',
    '--stdio', 'node build/index.js',
    '--port', port.toString(),
    '--healthEndpoint', '/healthz',
    '--cors'
  ], {
    stdio: ['pipe', 'inherit', 'inherit'],
    env: process.env
  });
  
  supergateway.on('close', (code) => {
    console.log(`Supergateway exited with code ${code}`);
    process.exit(code);
  });
  
  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down...');
    supergateway.kill();
    server.close();
    process.exit(0);
  });
}); 