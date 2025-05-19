/**
 * n8n API Client
 * 
 * This module provides a client for interacting with the n8n API.
 */

import axios, { AxiosInstance } from 'axios';
import { EnvConfig } from '../config/environment.js';
import { handleAxiosError, N8nApiError } from '../errors/index.js';

/**
 * n8n API Client class for making requests to the n8n API
 */
export class N8nApiClient {
  private axiosInstance: AxiosInstance;
  private config: EnvConfig;

  /**
   * Create a new n8n API client
   * 
   * @param config Environment configuration
   */
  constructor(config: EnvConfig) {
    this.config = config;
    // console.error('[N8nApiClient] Initializing. Base URL:', config.n8nApiUrl, 'Debug mode from config:', config.debug);
    this.axiosInstance = axios.create({
      baseURL: config.n8nApiUrl,
      headers: {
        'X-N8N-API-KEY': config.n8nApiKey,
        'Accept': 'application/json',
      },
      timeout: 10000, // 10 seconds
    });

    // Add request debugging if debug mode is enabled
    if (config.debug) {
      this.axiosInstance.interceptors.request.use(request => {
        console.error(`[N8nApiClient DEBUG] Request: ${request.method?.toUpperCase()} ${request.url}`);
        if (request.data && (request.method?.toUpperCase() === 'POST' || request.method?.toUpperCase() === 'PUT' || request.method?.toUpperCase() === 'PATCH')) {
          try {
            console.error(`[N8nApiClient DEBUG] Request Body: ${JSON.stringify(request.data, null, 2)}`);
          } catch (e) {
            console.error('[N8nApiClient DEBUG] Request Body: (Error stringifying request body)', request.data);
          }
        }
        return request;
      });

      this.axiosInstance.interceptors.response.use(response => {
        console.error(`[N8nApiClient DEBUG] Response: ${response.status} ${response.statusText} for ${response.config.method?.toUpperCase()} ${response.config.url}`);
        // Optionally log response data if needed, but can be very verbose
        // console.error(`[N8nApiClient DEBUG] Response Data: ${JSON.stringify(response.data, null, 2)}`); 
        return response;
      }, error => {
        if (axios.isAxiosError(error)) {
          console.error(`[N8nApiClient DEBUG] Axios Error Response: ${error.response?.status} ${error.response?.statusText} for ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
          if (error.response?.data) {
            try {
              console.error(`[N8nApiClient DEBUG] Axios Error Response Data: ${JSON.stringify(error.response.data, null, 2)}`);
            } catch (e) {
              console.error('[N8nApiClient DEBUG] Axios Error Response Data: (Error stringifying response data)', error.response.data);
            }
          }
        } else {
          console.error('[N8nApiClient DEBUG] Non-Axios Error in Response Interceptor:', error.message);
        }
        return Promise.reject(error);
      });
    }
  }

  /**
   * Check connectivity to the n8n API
   * 
   * @returns Promise that resolves if connectivity check succeeds
   * @throws N8nApiError if connectivity check fails
   */
  async checkConnectivity(): Promise<void> {
    try {
      // Try to fetch health endpoint or workflows
      const response = await this.axiosInstance.get('/workflows');
      
      if (response.status !== 200) {
        throw new N8nApiError(
          'n8n API connectivity check failed',
          response.status
        );
      }
      
      if (this.config.debug) {
        console.error(`[DEBUG] Successfully connected to n8n API at ${this.config.n8nApiUrl}`);
        console.error(`[DEBUG] Found ${response.data.data?.length || 0} workflows`);
      }
    } catch (error) {
      throw handleAxiosError(error, 'Failed to connect to n8n API');
    }
  }

  /**
   * Get the axios instance for making custom requests
   * 
   * @returns Axios instance
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  /**
   * Get all workflows from n8n
   * 
   * @returns Array of workflow objects
   */
  async getWorkflows(): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get('/workflows');
      return response.data.data || [];
    } catch (error) {
      throw handleAxiosError(error, 'Failed to fetch workflows');
    }
  }

  /**
   * Get a specific workflow by ID
   * 
   * @param id Workflow ID
   * @returns Workflow object
   */
  async getWorkflow(id: string): Promise<any> {
    // console.error(`[N8nApiClient] getWorkflow START. ID: ${id}`);
    try {
      const response = await this.axiosInstance.get(`/workflows/${id}`);
      // console.error(`[N8nApiClient] getWorkflow SUCCESS. ID: ${id}. Response status: ${response.status}. Top-level keys of data:`, Object.keys(response.data || {}));
      return response.data;
    } catch (error) {
      // console.error(`[N8nApiClient] getWorkflow ERROR. ID: ${id}.`);
      throw handleAxiosError(error, `Failed to fetch workflow ${id}`);
    }
  }

  /**
   * Get all workflow executions
   * 
   * @returns Array of execution objects
   */
  async getExecutions(): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get('/executions');
      return response.data.data || [];
    } catch (error) {
      throw handleAxiosError(error, 'Failed to fetch executions');
    }
  }

  /**
   * Get a specific execution by ID
   * 
   * @param id Execution ID
   * @returns Execution object
   */
  async getExecution(id: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get(`/executions/${id}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error, `Failed to fetch execution ${id}`);
    }
  }

  /**
   * Execute a workflow by ID
   * 
   * @param id Workflow ID
   * @param data Optional data to pass to the workflow
   * @returns Execution result
   */
  async executeWorkflow(id: string, data?: Record<string, any>): Promise<any> {
    try {
      const response = await this.axiosInstance.post(`/workflows/${id}/execute`, data || {});
      return response.data;
    } catch (error) {
      throw handleAxiosError(error, `Failed to execute workflow ${id}`);
    }
  }

  /**
   * Create a new workflow
   * 
   * @param workflow Workflow object to create
   * @returns Created workflow
   */
  async createWorkflow(workflow: Record<string, any>): Promise<any> {
    try {
      // Make sure settings property is present
      if (!workflow.settings) {
        workflow.settings = {
          saveExecutionProgress: true,
          saveManualExecutions: true,
          saveDataErrorExecution: "all",
          saveDataSuccessExecution: "all",
          executionTimeout: 3600,
          timezone: "UTC"
        };
      }
      
      // Remove read-only properties that cause issues
      const workflowToCreate = { ...workflow };
      delete workflowToCreate.active; // Remove active property as it's read-only
      delete workflowToCreate.id; // Remove id property if it exists
      delete workflowToCreate.createdAt; // Remove createdAt property if it exists
      delete workflowToCreate.updatedAt; // Remove updatedAt property if it exists
      delete workflowToCreate.tags; // Remove tags property as it's read-only
      
      // Log request for debugging
      console.error('[DEBUG] Creating workflow with data:', JSON.stringify(workflowToCreate, null, 2));
      
      const response = await this.axiosInstance.post('/workflows', workflowToCreate);
      return response.data;
    } catch (error) {
      console.error('[ERROR] Create workflow error:', error);
      throw handleAxiosError(error, 'Failed to create workflow');
    }
  }

  /**
   * Update an existing workflow
   * 
   * @param id Workflow ID
   * @param workflow Updated workflow object
   * @returns Updated workflow
   */
  async updateWorkflow(id: string, workflow: Record<string, any>): Promise<any> {
    // console.error(`[N8nApiClient] updateWorkflow START. ID: ${id}. Payload to send via PUT:`, JSON.stringify(workflow, null, 2));
    try {
      const response = await this.axiosInstance.put(`/workflows/${id}`, workflow);
      // console.error(`[N8nApiClient] updateWorkflow SUCCESS. ID: ${id}. Response status: ${response.status}. Data:`, JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      // console.error(`[N8nApiClient] updateWorkflow ERROR. ID: ${id}.`);
      throw handleAxiosError(error, `Failed to update workflow ${id}`);
    }
  }

  /**
   * Delete a workflow
   * 
   * @param id Workflow ID
   * @returns Deleted workflow
   */
  async deleteWorkflow(id: string): Promise<any> {
    try {
      const response = await this.axiosInstance.delete(`/workflows/${id}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error, `Failed to delete workflow ${id}`);
    }
  }

  /**
   * Activate a workflow
   * 
   * @param id Workflow ID
   * @returns Activated workflow
   */
  async activateWorkflow(id: string): Promise<any> {
    try {
      const response = await this.axiosInstance.post(`/workflows/${id}/activate`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error, `Failed to activate workflow ${id}`);
    }
  }

  /**
   * Deactivate a workflow
   * 
   * @param id Workflow ID
   * @returns Deactivated workflow
   */
  async deactivateWorkflow(id: string): Promise<any> {
    try {
      const response = await this.axiosInstance.post(`/workflows/${id}/deactivate`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error, `Failed to deactivate workflow ${id}`);
    }
  }
  
  /**
   * Delete an execution
   * 
   * @param id Execution ID
   * @returns Deleted execution or success message
   */
  async deleteExecution(id: string): Promise<any> {
    try {
      const response = await this.axiosInstance.delete(`/executions/${id}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error, `Failed to delete execution ${id}`);
    }
  }
}

/**
 * Create and return a configured n8n API client
 * 
 * @param config Environment configuration
 * @returns n8n API client instance
 */
export function createApiClient(config: EnvConfig): N8nApiClient {
  return new N8nApiClient(config);
}
