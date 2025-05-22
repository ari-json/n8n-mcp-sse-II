import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialize environment variables
dotenv.config();

// Get directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create Express app
const app = express();
app.use(express.json());
app.use(cors());

// Get environment variables
const N8N_API_URL = process.env.N8N_API_URL || '';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

// Validate required environment variables
if (!N8N_API_URL || !N8N_API_KEY) {
  console.error('ERROR: N8N_API_URL and N8N_API_KEY are required in .env file');
  process.exit(1);
}

// Extract base URL (without /api/v1)
const N8N_BASE_URL = N8N_API_URL.replace(/\/api\/v1\/?$/, '');

// MCP tools implementation
const tools = {
  // Workflow tools
  list_workflows: async () => {
    const response = await axios.get(`${N8N_API_URL}/workflows`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }
    });
    return { workflows: response.data };
  },
  
  get_workflow: async (params) => {
    const { id } = params;
    if (!id) throw new Error('Workflow ID is required');
    
    const response = await axios.get(`${N8N_API_URL}/workflows/${id}`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }
    });
    return { workflow: response.data };
  },
  
  create_workflow: async (params) => {
    const { name, nodes, connections } = params;
    if (!name) throw new Error('Workflow name is required');
    
    const response = await axios.post(`${N8N_API_URL}/workflows`, {
      name,
      nodes: nodes || [],
      connections: connections || {}
    }, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }
    });
    return { workflow: response.data };
  },
  
  update_workflow: async (params) => {
    const { id, name, nodes, connections, active } = params;
    if (!id) throw new Error('Workflow ID is required');
    
    const response = await axios.put(`${N8N_API_URL}/workflows/${id}`, {
      name,
      nodes,
      connections,
      active
    }, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }
    });
    return { workflow: response.data };
  },
  
  delete_workflow: async (params) => {
    const { id } = params;
    if (!id) throw new Error('Workflow ID is required');
    
    await axios.delete(`${N8N_API_URL}/workflows/${id}`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }
    });
    return { success: true };
  },
  
  activate_workflow: async (params) => {
    const { id } = params;
    if (!id) throw new Error('Workflow ID is required');
    
    const response = await axios.post(`${N8N_API_URL}/workflows/${id}/activate`, {}, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }
    });
    return { success: true, workflow: response.data };
  },
  
  deactivate_workflow: async (params) => {
    const { id } = params;
    if (!id) throw new Error('Workflow ID is required');
    
    const response = await axios.post(`${N8N_API_URL}/workflows/${id}/deactivate`, {}, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }
    });
    return { success: true, workflow: response.data };
  },
  
  // Execution tools
  list_executions: async (params) => {
    const { workflowId } = params;
    if (!workflowId) throw new Error('Workflow ID is required');
    
    const response = await axios.get(`${N8N_API_URL}/executions`, {
      params: { workflowId },
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }
    });
    return { executions: response.data };
  },
  
  get_execution: async (params) => {
    const { id } = params;
    if (!id) throw new Error('Execution ID is required');
    
    const response = await axios.get(`${N8N_API_URL}/executions/${id}`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }
    });
    return { execution: response.data };
  },
  
  delete_execution: async (params) => {
    const { id } = params;
    if (!id) throw new Error('Execution ID is required');
    
    await axios.delete(`${N8N_API_URL}/executions/${id}`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }
    });
    return { success: true };
  },
  
  run_webhook: async (params) => {
    const { workflowName, data } = params;
    if (!workflowName) throw new Error('Workflow name is required');
    
    const webhookUrl = `${N8N_BASE_URL}/webhook/${workflowName}`;
    const response = await axios.post(webhookUrl, data, {
      auth: {
        username: process.env.N8N_WEBHOOK_USERNAME || '',
        password: process.env.N8N_WEBHOOK_PASSWORD || ''
      }
    });
    return { result: response.data };
  },
  
  // Node types tool
  list_node_types: async () => {
    try {
      const url = `${N8N_BASE_URL}/types/nodes.json`;
      const response = await axios.get(url, {
        headers: { 'X-N8N-API-KEY': N8N_API_KEY }
      });
      return { nodeTypes: response.data };
    } catch (error) {
      console.error('Error fetching node types:', error.message);
      // Fallback to a local file if available
      try {
        const localNodesPath = path.join(__dirname, '..', 'nodes-list.json');
        if (fs.existsSync(localNodesPath)) {
          const nodeTypes = JSON.parse(fs.readFileSync(localNodesPath, 'utf8'));
          return { nodeTypes };
        }
      } catch (e) {
        console.error('Error reading local nodes file:', e.message);
      }
      throw new Error('Failed to fetch node types');
    }
  }
};

// Handle MCP tool calls
app.post('/mcp/call', async (req, res) => {
  const { tool, parameters = {} } = req.body;
  
  try {
    if (!tools[tool]) {
      return res.status(400).json({ 
        error: `Unknown tool: ${tool}`, 
        availableTools: Object.keys(tools) 
      });
    }
    
    const result = await tools[tool](parameters);
    res.json(result);
  } catch (error) {
    console.error(`Error executing tool ${tool}:`, error);
    res.status(500).json({ 
      error: error.message,
      tool,
      parameters 
    });
  }
});

// Claude Desktop tool manifest
app.get('/.well-known/ai-plugin.json', (req, res) => {
  res.json({
    name: 'n8n-mcp-cloud',
    description: 'Local MCP bridge for n8n Cloud',
    tools: [
      {
        name: 'list_workflows',
        description: 'List all workflows in your n8n Cloud account',
        parameters: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'get_workflow',
        description: 'Get details of a specific workflow',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Workflow ID' }
          },
          required: ['id']
        }
      },
      {
        name: 'create_workflow',
        description: 'Create a new workflow in n8n Cloud',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Workflow name' },
            nodes: { type: 'array', description: 'Workflow nodes' },
            connections: { type: 'object', description: 'Node connections' }
          },
          required: ['name']
        }
      },
      {
        name: 'update_workflow',
        description: 'Update an existing workflow',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Workflow ID' },
            name: { type: 'string', description: 'Workflow name' },
            nodes: { type: 'array', description: 'Workflow nodes' },
            connections: { type: 'object', description: 'Node connections' },
            active: { type: 'boolean', description: 'Whether the workflow is active' }
          },
          required: ['id']
        }
      },
      {
        name: 'delete_workflow',
        description: 'Delete a workflow',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Workflow ID' }
          },
          required: ['id']
        }
      },
      {
        name: 'activate_workflow',
        description: 'Activate a workflow',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Workflow ID' }
          },
          required: ['id']
        }
      },
      {
        name: 'deactivate_workflow',
        description: 'Deactivate a workflow',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Workflow ID' }
          },
          required: ['id']
        }
      },
      {
        name: 'list_executions',
        description: 'List executions for a workflow',
        parameters: {
          type: 'object',
          properties: {
            workflowId: { type: 'string', description: 'Workflow ID' }
          },
          required: ['workflowId']
        }
      },
      {
        name: 'get_execution',
        description: 'Get details of a specific execution',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Execution ID' }
          },
          required: ['id']
        }
      },
      {
        name: 'delete_execution',
        description: 'Delete an execution',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Execution ID' }
          },
          required: ['id']
        }
      },
      {
        name: 'run_webhook',
        description: 'Execute a workflow via webhook',
        parameters: {
          type: 'object',
          properties: {
            workflowName: { type: 'string', description: 'Workflow name' },
            data: { type: 'object', description: 'Data to pass to the webhook' }
          },
          required: ['workflowName']
        }
      },
      {
        name: 'list_node_types',
        description: 'List all available node types in n8n',
        parameters: {
          type: 'object',
          properties: {}
        }
      }
    ]
  });
});

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).send('ok');
});

// Create HTTP server
const server = createServer(app);

// Start server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Local n8n MCP server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/healthz`);
  console.log(`MCP endpoint: http://localhost:${port}/mcp/call`);
  console.log(`Manifest: http://localhost:${port}/.well-known/ai-plugin.json`);
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  server.close();
  process.exit(0);
}); 