import axios from 'axios';
import { BaseWorkflowToolHandler } from '../workflow/base-handler.js';
import { ToolDefinition, ToolCallResult } from '../../types/index.js';
import { getEnvConfig } from '../../config/environment.js';

export class ListNodeTypesHandler extends BaseWorkflowToolHandler {
  /** Execute the tool */
  async execute(args: Record<string, any>): Promise<ToolCallResult> {
    return this.handleExecution(async () => {
      const { n8nApiUrl, n8nApiKey } = getEnvConfig();
      // strip trailing slash if any and remove /api/v1 if present
      const baseUrl = n8nApiUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
      const url = `${baseUrl}/types/nodes.json`;
      
      const res = await axios.get(url, { 
        headers: { 'X-N8N-API-KEY': n8nApiKey }
      });
      
      const types = res.data;
      // pretty-print JSON
      return this.formatSuccess(types, `Found ${Array.isArray(types) ? types.length : 0} node types`);
    }, args);
  }
}

/** Expose the tool definition */
export function getListNodeTypesToolDefinition(): ToolDefinition {
  return {
    name: 'list_node_types',
    description: 'Retrieve all available n8n node types (their internal IDs & metadata)',
    inputSchema: { 
      type: 'object', 
      properties: {},
      required: []
    }
  };
} 