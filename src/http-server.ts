#!/usr/bin/env node
/**
 * n8n MCP HTTP Server - Entry Point for HTTP mode
 * 
 * This file serves as the entry point for the n8n MCP Server in HTTP mode,
 * which allows AI assistants to interact with n8n workflows through the MCP protocol
 * using SSE and HTTP endpoints.
 */

import { Server as HttpServer } from 'http';
import { Supergateway } from '@modelcontextprotocol/supergateway';
import { loadEnvironmentVariables } from './config/environment.js';
import { configureServer } from './config/server.js';
import { configureExpress } from './config/express.js';

// Load environment variables
loadEnvironmentVariables();

/**
 * Main function to start the n8n MCP HTTP Server
 */
async function main() {
  try {
    console.error('Starting n8n MCP HTTP Server...');

    // Get the port from environment or use default
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;
    
    // Create and configure the Express app with Basic Auth
    const app = configureExpress();
    
    // Create HTTP server from Express app
    const httpServer = new HttpServer(app);
    
    // Create and configure the MCP server
    const mcpServer = await configureServer();
    
    // Set up error handling
    mcpServer.onerror = (error: unknown) => console.error('[MCP Error]', error);
    
    // Create Supergateway instance with our Express app
    const gateway = new Supergateway({
      server: httpServer,
      app,
      logLevel: process.env.DEBUG === 'true' ? 'debug' : 'info',
      cors: true,
      healthEndpoint: '/healthz',
    });
    
    // Register the MCP server with Supergateway
    gateway.registerMcpServer(mcpServer);
    
    // Start the HTTP server
    httpServer.listen(port, () => {
      console.error(`n8n MCP HTTP Server running on port ${port}`);
      console.error(`SSE endpoint: http://localhost:${port}/sse`);
      console.error(`Message endpoint: http://localhost:${port}/message`);
      console.error(`Health endpoint: http://localhost:${port}/healthz`);
    });
    
    // Set up clean shutdown
    process.on('SIGINT', async () => {
      console.error('Shutting down n8n MCP HTTP Server...');
      httpServer.close();
      await mcpServer.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to start n8n MCP HTTP Server:', error);
    process.exit(1);
  }
}

// Start the server
main().catch(console.error); 