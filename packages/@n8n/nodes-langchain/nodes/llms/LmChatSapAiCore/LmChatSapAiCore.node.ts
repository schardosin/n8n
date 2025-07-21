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
		console.log(options.maxTokens);
		const orchestrationConfig: LangChainOrchestrationModuleConfig = {
			llm: {
				model_name: modelName, // This comes from n8n UI selection
				model_params: {
					temperature: options.temperature ?? 0.7,
					max_tokens: options.maxTokens ?? 8192,
				},
			},
		};

		// Resource group configuration for deployment resolution
		const deploymentConfig = {
			resourceGroup: credentials.resourceGroup as string,
		};

		// Create OrchestrationClient - universal client for all model types
		const client = new OrchestrationClient(
			orchestrationConfig,
			{
				callbacks: [new N8nLlmTracing(this)],
			},
			deploymentConfig,
			destination,
		);

		return {
			response: client,
		};
	}
}
