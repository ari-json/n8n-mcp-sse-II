#!/usr/bin/env node
/**
 * Express Server with Basic Auth for n8n MCP
 * 
 * This file sets up an Express server with Basic Auth middleware
 * for the /sse and /message endpoints, then runs Supergateway in stdio mode.
 */

const express = require('express');
const basicAuth = require('express-basic-auth');
const { spawn } = require('child_process');
const { createServer } = require('http');

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

// Start Supergateway in stdio mode - this will not try to bind to a port
const supergateway = spawn('npx', [
  '-y',
  'supergateway',
  '--stdio', 'node build/index.js',
  '--outputTransport', 'stdio',
  '--logLevel', debug ? 'debug' : 'info'
], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: process.env
});

// Set up buffer for collecting Supergateway responses
let responseBuffer = '';
supergateway.stdout.on('data', (data) => {
  responseBuffer += data.toString();
});

// Handle SSE endpoint
app.get('/sse', (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send initial connection message
  res.write('event: connected\ndata: {"connected":true}\n\n');
  
  // Keep connection alive with periodic pings
  const pingInterval = setInterval(() => {
    res.write('event: ping\ndata: {"ping":true}\n\n');
  }, 30000);
  
  // Clean up on close
  res.on('close', () => {
    clearInterval(pingInterval);
  });
});

// Handle message endpoint with JSON parsing
app.use(express.json());
app.post('/message', (req, res) => {
  console.log('Received message:', req.body);
  
  // Send message to Supergateway stdin
  supergateway.stdin.write(JSON.stringify(req.body) + '\n');
  
  // Simple timeout to collect response
  setTimeout(() => {
    try {
      const responseLines = responseBuffer.split('\n');
      let lastResponse = null;
      
      // Try to find a valid JSON response
      for (let i = responseLines.length - 1; i >= 0; i--) {
        if (responseLines[i].trim()) {
          try {
            lastResponse = JSON.parse(responseLines[i]);
            break;
          } catch (e) {
            // Not valid JSON, continue
          }
        }
      }
      
      // Clear buffer
      responseBuffer = '';
      
      if (lastResponse) {
        res.json(lastResponse);
      } else {
        // Fallback response
        res.json({ success: true, message: 'Message processed' });
      }
    } catch (error) {
      console.error('Error processing response:', error);
      res.json({ success: true, message: 'Message processed but response parsing failed' });
    }
  }, 1000); // Wait 1 second for response
});

// Start server
server.listen(port, () => {
  console.log(`Express server with Basic Auth running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/healthz`);
  console.log(`SSE endpoint: http://localhost:${port}/sse`);
  console.log(`Message endpoint: http://localhost:${port}/message`);
  
  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down...');
    supergateway.kill();
    server.close();
    process.exit(0);
  });
});

// Handle Supergateway exit
supergateway.on('close', (code) => {
  console.log(`Supergateway exited with code ${code}`);
  if (code !== 0) {
    console.error('Supergateway failed, shutting down...');
    process.exit(code);
  }
}); 