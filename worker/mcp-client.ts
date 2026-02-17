import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
interface MCPServerConfig {
  name: string;
  sseUrl: string;
}
const MCP_SERVERS: MCPServerConfig[] = [
  // Example: { name: 'playwright', sseUrl: 'http://localhost:3001/sse' }
];
export class MCPManager {
  private clients: Map<string, Client> = new Map();
  private toolMap: Map<string, string> = new Map();
  private initialized = false;
  async initialize() {
    if (this.initialized) return;
    for (const serverConfig of MCP_SERVERS) {
      try {
        const transport = new SSEClientTransport(new URL(serverConfig.sseUrl));
        const client = new Client({ name: 'contractor-agent', version: '1.0.0' }, { capabilities: {} });
        await client.connect(transport);
        this.clients.set(serverConfig.name, client);
        const toolsResult = await client.listTools();
        if (toolsResult?.tools) {
          for (const tool of toolsResult.tools) {
            this.toolMap.set(tool.name, serverConfig.name);
          }
        }
      } catch (error) {
        console.error(`Failed to connect to MCP server ${serverConfig.name}:`, error);
      }
    }
    this.initialized = true;
  }
  async getToolDefinitions() {
    await this.initialize();
    const allTools = [];
    for (const [serverName, client] of this.clients.entries()) {
      try {
        const toolsResult = await client.listTools();
        if (toolsResult?.tools) {
          for (const tool of toolsResult.tools) {
            allTools.push({
              type: 'function' as const,
              function: {
                name: tool.name,
                description: tool.description || '',
                parameters: tool.inputSchema || { type: 'object', properties: {}, required: [] }
              }
            });
          }
        }
      } catch (e) {}
    }
    return allTools;
  }
  async executeTool(toolName: string, args: Record<string, unknown>): Promise<string> {
    await this.initialize();
    const serverName = this.toolMap.get(toolName);
    if (!serverName) throw new Error(`Tool ${toolName} not found`);
    const client = this.clients.get(serverName);
    if (!client) throw new Error(`Client ${serverName} not available`);
    const result = await client.callTool({ name: toolName, arguments: args });
    if (result.isError) throw new Error('Tool execution failed');
    return Array.isArray(result.content) ? result.content.map((c: any) => c.text).join('\n') : 'No content';
  }
}
export const mcpManager = new MCPManager();