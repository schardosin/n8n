import type { INodeProperties } from 'n8n-workflow';

const SUPPORTED_MODELS = [
	// Anthropic Models
	{ name: 'Claude 4 Sonnet', value: 'anthropic--claude-4-sonnet' },
	{ name: 'Claude 4 Opus', value: 'anthropic--claude-4-opus' },
	{ name: 'Claude 3.7 Sonnet', value: 'anthropic--claude-3.7-sonnet' },
	{ name: 'Claude 3.5 Sonnet', value: 'anthropic--claude-3.5-sonnet' },
	{ name: 'Claude 3 Sonnet', value: 'anthropic--claude-3-sonnet' },
	{ name: 'Claude 3 Haiku', value: 'anthropic--claude-3-haiku' },
	{ name: 'Claude 3 Opus', value: 'anthropic--claude-3-opus' },

	// Gemini Models
	{ name: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro' },
	{ name: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash' },

	// OpenAI Models
	{ name: 'GPT-4', value: 'gpt-4' },
	{ name: 'GPT-4o', value: 'gpt-4o' },
	{ name: 'GPT-4o Mini', value: 'gpt-4o-mini' },
	{ name: 'GPT-4.1', value: 'gpt-4.1' },
	{ name: 'GPT-4.1 Nano', value: 'gpt-4.1-nano' },
	{ name: 'O1', value: 'o1' },
	{ name: 'O3', value: 'o3' },
	{ name: 'O3 Mini', value: 'o3-mini' },
	{ name: 'O4 Mini', value: 'o4-mini' },
];

export const sapAiCoreModel: INodeProperties = {
	displayName: 'Model',
	name: 'model',
	type: 'options',
	default: 'gpt-4o',
	required: true,
	options: SUPPORTED_MODELS,
	description: 'The model to use for completion',
};

export const sapAiCoreOptions: INodeProperties = {
	displayName: 'Options',
	name: 'options',
	placeholder: 'Add Option',
	description: 'Additional options to add',
	type: 'collection',
	default: {},
	options: [
		{
			displayName: 'Maximum Number of Tokens',
			name: 'maxTokens',
			default: 8192,
			description: 'The maximum number of tokens to generate',
			type: 'number',
		},
		{
			displayName: 'Temperature',
			name: 'temperature',
			default: 0.7,
			description: 'Controls randomness in the response',
			type: 'number',
			typeOptions: {
				minValue: 0,
				maxValue: 2,
				numberPrecision: 1,
			},
		},
		{
			displayName: 'Frequency Penalty',
			name: 'frequencyPenalty',
			default: 0,
			description: 'Penalize new tokens based on their frequency',
			type: 'number',
			typeOptions: {
				minValue: -2,
				maxValue: 2,
				numberPrecision: 1,
			},
		},
		{
			displayName: 'Presence Penalty',
			name: 'presencePenalty',
			default: 0,
			description: 'Penalize new tokens based on their presence',
			type: 'number',
			typeOptions: {
				minValue: -2,
				maxValue: 2,
				numberPrecision: 1,
			},
		},
		{
			displayName: 'Timeout',
			name: 'timeout',
			default: 60000,
			description: 'Maximum amount of time a request is allowed to take in milliseconds',
			type: 'number',
		},
		{
			displayName: 'Max Retries',
			name: 'maxRetries',
			default: 2,
			description: 'Maximum number of retries to attempt',
			type: 'number',
		},
	],
};

export const sapAiCoreDescription = {
	credentials: [
		{
			name: 'sapAiCoreApi',
			required: true,
		},
	],
};
