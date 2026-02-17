import { mcpManager } from './mcp-client';
export type ToolResult =
  | { status: 'success'; message: string }
  | { content: string }
  | { error: string };
const customTools = [
  {
    type: 'function' as const,
    function: {
      name: 'propose_contract',
      description: 'Propose a structured Prompt Contract based on the conversation so far.',
      parameters: {
        type: 'object',
        properties: {
          goal: { type: 'string', description: 'The primary objective of the prompt' },
          constraints: { type: 'string', description: 'Technical and stylistic constraints' },
          format: { type: 'string', description: 'The exact output format required' },
          failure_conditions: { type: 'string', description: 'Instructions for when the goal cannot be met' },
        },
        required: ['goal', 'constraints', 'format', 'failure_conditions'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'browse_documentation',
      description:
        'Search or browse technical documentation to find best practices for a specific technology.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The technology or API to research' },
        },
        required: ['query'],
      },
    },
  },
];
function toText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
export async function getToolDefinitions() {
  const mcpTools = await mcpManager.getToolDefinitions();
  return [...customTools, ...mcpTools];
}
export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  state: any
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'propose_contract': {
        // Writes a correctly-shaped latestDraft for the frontend.
        state.latestDraft = {
          goal: toText(args.goal),
          constraints: toText(args.constraints),
          format: toText(args.format),
          failureConditions: toText(args.failure_conditions),
        };
        return { status: 'success', message: 'Contract draft proposed to user.' };
      }
      case 'browse_documentation': {
        // Mock implementation for Phase 1
        return {
          content: `Research results for "${toText(
            args.query
          )}": Found best practices including security headers, rate limiting, and standard error response structures. Use Bearer token auth.`,
        };
      }
      default: {
        const content = await mcpManager.executeTool(name, args);
        return { content };
      }
    }
  } catch (error) {
    console.error('[tools] executeTool failed:', { name, error });
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}