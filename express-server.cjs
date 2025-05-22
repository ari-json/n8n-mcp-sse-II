#!/usr/bin/env node
/**
 * Express Server with Basic Auth for n8n MCP
 * 
 * This file sets up an Express server with Basic Auth middleware
 * for the /sse and /message endpoints, then proxies to Supergateway.
 */

const express = require('express');
const basicAuth = require('express-basic-auth');
const { spawn } = require('child_process');
const { createServer } = require('http');
const httpProxy = require('http-proxy');

// Create Express app
const app = express();

// Get environment variables
const externalPort = process.env.PORT || 8080;
const internalPort = 3000; // Supergateway will use this port internally
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

// Create proxy server
const proxy = httpProxy.createProxyServer({
  target: `http://localhost:${internalPort}`,
  ws: true
});

// Handle proxy errors
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  if (!res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
  }
});

// Forward authenticated requests to Supergateway
app.get('/sse', (req, res) => {
  // Basic Auth is already verified by middleware
  proxy.web(req, res, { target: `http://localhost:${internalPort}/sse` });
});

app.post('/message', (req, res) => {
  // Basic Auth is already verified by middleware
  proxy.web(req, res, { target: `http://localhost:${internalPort}/message` });
});

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).send('ok');
});

// Create HTTP server
const server = createServer(app);

// Start server
server.listen(externalPort, () => {
  console.log(`Express server with Basic Auth running on port ${externalPort}`);
  console.log(`Health check: http://localhost:${externalPort}/healthz`);
  console.log(`SSE endpoint: http://localhost:${externalPort}/sse`);
  console.log(`Message endpoint: http://localhost:${externalPort}/message`);

  // Start Supergateway on the internal port
  const supergateway = spawn('npx', [
    '-y',
    'supergateway',
    '--stdio', 'node build/index.js',
    '--port', internalPort.toString(),
    '--logLevel', debug ? 'debug' : 'info',
    '--cors'
  ], {
    stdio: 'inherit',
    env: process.env
  });

  // Handle Supergateway exit
  supergateway.on('close', (code) => {
    console.log(`Supergateway exited with code ${code}`);
    if (code !== 0) {
      console.error('Supergateway failed, shutting down...');
      process.exit(code);
    }
  });

  // Handle server shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down...');
    proxy.close();
    supergateway.kill();
    server.close();
    process.exit(0);
  });
}); 