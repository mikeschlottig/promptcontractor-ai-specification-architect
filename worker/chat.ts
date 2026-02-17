import OpenAI from 'openai';
import type { Message, ToolCall, ChatState } from './types';
import { getToolDefinitions, executeTool } from './tools';
import { ChatCompletionMessageFunctionToolCall } from 'openai/resources/index.mjs';
export class ChatHandler {
  private client: OpenAI;
  private model: string;
  constructor(aiGatewayUrl: string, apiKey: string, model: string) {
    this.client = new OpenAI({
      baseURL: aiGatewayUrl,
      apiKey: apiKey
    });
    this.model = model;
  }
  async processMessage(
    message: string,
    conversationHistory: Message[],
    state: ChatState,
    onChunk?: (chunk: string) => void
  ): Promise<{
    content: string;
    toolCalls?: ToolCall[];
  }> {
    const messages = this.buildConversationMessages(message, conversationHistory);
    const toolDefinitions = await getToolDefinitions();
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages,
      tools: toolDefinitions,
      tool_choice: 'auto',
      max_tokens: 4000,
      stream: false
    });
    const responseMessage = completion.choices[0]?.message;
    if (!responseMessage) {
      return { content: 'I apologize, but I encountered an issue.' };
    }
    if (!responseMessage.tool_calls) {
      return {
        content: responseMessage.content || 'How can I help you refine your prompt contract today?'
      };
    }
    const toolCalls = await this.executeToolCalls(responseMessage.tool_calls as ChatCompletionMessageFunctionToolCall[], state);
    const finalResponse = await this.generateToolResponse(
      message,
      conversationHistory,
      responseMessage.tool_calls,
      toolCalls
    );
    return { content: finalResponse, toolCalls };
  }
  private async executeToolCalls(openAiToolCalls: ChatCompletionMessageFunctionToolCall[], state: ChatState): Promise<ToolCall[]> {
    return Promise.all(
      openAiToolCalls.map(async (tc) => {
        try {
          const args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
          const result = await executeTool(tc.function.name, args, state);
          return {
            id: tc.id,
            name: tc.function.name,
            arguments: args,
            result
          };
        } catch (error) {
          console.error(`Tool execution failed:`, error);
          return {
            id: tc.id,
            name: tc.function.name,
            arguments: {},
            result: { error: 'Failed' }
          };
        }
      })
    );
  }
  private async generateToolResponse(
    userMessage: string,
    history: Message[],
    openAiToolCalls: any[],
    toolResults: ToolCall[]
  ): Promise<string> {
    const followUp = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: 'Respond to the user about the tool results. If you proposed a contract, tell them to review it in the editor.' },
        ...history.slice(-5).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage },
        { role: 'assistant', content: null, tool_calls: openAiToolCalls },
        ...toolResults.map((result) => ({
          role: 'tool' as const,
          content: JSON.stringify(result.result),
          tool_call_id: result.id
        }))
      ]
    });
    return followUp.choices[0]?.message?.content || 'Done.';
  }
  private buildConversationMessages(userMessage: string, history: Message[]) {
    return [
      {
        role: 'system' as const,
        content: `You are the PromptContractor Architect. Your job is to help users build rigorous "Prompt Contracts".
        A Prompt Contract has 4 clauses:
        1. GOAL: Clear, high-level objective.
        2. CONSTRAINTS: Technical limits, style, and "never" rules.
        3. OUTPUT FORMAT: Exact structure (JSON, Markdown, etc).
        4. FAILURE CONDITIONS: What to do if the goal cannot be met.
        When you have enough information, ALWAYS use the 'propose_contract' tool to push a draft to the user.
        Use 'browse_documentation' to research specific APIs or technologies if the user mentions them.`
      },
      ...history.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      })),
      { role: 'user' as const, content: userMessage }
    ];
  }
  updateModel(newModel: string): void {
    this.model = newModel;
  }
}