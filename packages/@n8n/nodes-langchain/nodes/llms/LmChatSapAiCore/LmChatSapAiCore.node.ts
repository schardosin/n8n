import { OrchestrationClient } from '@sap-ai-sdk/langchain';
import type { LangChainOrchestrationModuleConfig } from '@sap-ai-sdk/langchain';
import {
	NodeConnectionTypes,
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	type SupplyData,
} from 'n8n-workflow';

import { getConnectionHintNoticeField } from '@utils/sharedFields';

import { N8nLlmTracing } from '../N8nLlmTracing';
import { sapAiCoreDescription, sapAiCoreModel, sapAiCoreOptions } from './description';

export class LmChatSapAiCore implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SAP AI Core Chat Model',
		name: 'lmChatSapAiCore',
		icon: 'file:sap_ai_core.svg',
		group: ['transform'],
		version: [1],
		defaultVersion: 1,
		description: 'SAP AI Core',
		defaults: {
			name: 'SAP AI Core Chat Model',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models', 'Root Nodes'],
				'Language Models': ['Chat Models (Recommended)'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://help.sap.com/docs/sap-ai-core',
					},
				],
			},
			alias: ['sap', 'ai core', 'claude', 'gemini', 'gpt'],
		},
		inputs: [],
		outputs: [NodeConnectionTypes.AiLanguageModel],
		outputNames: ['Model'],
		...sapAiCoreDescription,
		properties: [
			getConnectionHintNoticeField([NodeConnectionTypes.AiChain, NodeConnectionTypes.AiAgent]),
			sapAiCoreModel,
			sapAiCoreOptions,
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('sapAiCoreApi');
		const modelName = this.getNodeParameter('model', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as {
			maxTokens?: number;
			temperature?: number;
			frequencyPenalty?: number;
			presencePenalty?: number;
			timeout?: number;
			maxRetries?: number;
		};

		// Create destination object from n8n credentials
		const destination = {
			url: credentials.baseUrl as string,
			headers: {
				Authorization: `Bearer ${credentials.sessionToken}`,
				'AI-Resource-Group': credentials.resourceGroup as string,
			},
		};

		// Configure orchestration for the selected model
		// Template is optional as of v1.16.0 - following the tutorial pattern
		const orchestrationConfig: LangChainOrchestrationModuleConfig = {
			llm: {
				model_name: modelName,
			},
		};

		// Resource group configuration for deployment resolution
		const deploymentConfig = {
			resourceGroup: credentials.resourceGroup as string,
		};

		// Create OrchestrationClient - universal client for all model types
		// Note: Each client instance should be independent to avoid credential caching issues
		const client = new OrchestrationClient(
			orchestrationConfig,
			{
				callbacks: [new N8nLlmTracing(this)],
			},
			deploymentConfig,
			destination,
		);

		// Fix: SAP AI SDK's bindTools() returns a broken RunnableBinding with no methods
		// Override bindTools to modify the original client's invoke method for tool support
		const originalBindTools = client.bindTools.bind(client);
		client.bindTools = function (tools, kwargs) {
			const originalInvoke = client.invoke.bind(client);

			// Override the client's invoke method to include tools
			(client as any).invoke = async function (input: any, options?: any) {
				// Prepare tools description for the system message
				const toolsDescription = tools
					.map((tool: any) => {
						return `Tool: ${tool.name}\nDescription: ${tool.description}\nParameters: ${JSON.stringify(tool.schema || {})}`;
					})
					.join('\n\n');

				// Modify the input to include tools information
				let modifiedInput = input;
				if (Array.isArray(input)) {
					const systemMessageIndex = input.findIndex((msg: any) => msg.role === 'system');
					const toolsSystemMessage = `You have access to the following tools. When you need to use a tool, respond with a JSON object containing "tool_calls" array with objects having "name" and "arguments" properties.
						Available tools:
						${toolsDescription}

						Use tools when appropriate to help answer the user's request.`;

					if (systemMessageIndex >= 0) {
						// Append to existing system message
						const inputArray = input as Array<{ role: string; content: string }>;
						const existingMessage = inputArray[systemMessageIndex];
						modifiedInput = [...inputArray];
						(modifiedInput as Array<{ role: string; content: string }>)[systemMessageIndex] = {
							...existingMessage,
							content: existingMessage.content + '\n\n' + toolsSystemMessage,
						};
					} else {
						// Add new system message at the beginning
						modifiedInput = [{ role: 'system', content: toolsSystemMessage }, ...input];
					}
				}

				const response = await originalInvoke(modifiedInput, options);

				// Parse tool calls from response content
				if (response?.content && typeof response.content === 'string') {
					try {
						const toolCallMatch = response.content.match(/\{[\s\S]*"tool_calls"[\s\S]*\}/);
						if (toolCallMatch) {
							const toolCallData = JSON.parse(toolCallMatch[0]);
							if (toolCallData.tool_calls && Array.isArray(toolCallData.tool_calls)) {
								(response as any).tool_calls = toolCallData.tool_calls.map((call: any) => ({
									name: call.name,
									args: call.arguments || call.args,
									id: `call_${Math.random().toString(36).substr(2, 9)}`,
								}));
							}
						}
					} catch (parseError) {
						// Silently handle parsing errors
					}
				}

				return response;
			};

			return client;
		};

		return {
			response: client,
		};
	}
}
