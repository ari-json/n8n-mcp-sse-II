import { getListNodeTypesToolDefinition, ListNodeTypesHandler } from './list.js';

export { ListNodeTypesHandler };

export async function setupNodeTypesTools() {
  return [getListNodeTypesToolDefinition()];
} 