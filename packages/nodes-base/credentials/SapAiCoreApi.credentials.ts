import type {
	IAuthenticateGeneric,
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestHelper,
	INodeProperties,
} from 'n8n-workflow';

export class SapAiCoreApi implements ICredentialType {
	name = 'sapAiCoreApi';

	displayName = 'SAP AI Core API';

	documentationUrl = 'sapaicore';

	properties: INodeProperties[] = [
		{
			displayName: 'Session Token',
			name: 'sessionToken',
			type: 'hidden',
			typeOptions: {
				expirable: true,
				password: true,
			},
			default: '',
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			required: true,
			default: '',
			description: 'SAP AI Core Client ID',
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'SAP AI Core Client Secret',
		},
		{
			displayName: 'Auth URL',
			name: 'authUrl',
			type: 'string',
			required: true,
			default: '',
			placeholder: 'https://<subdomain>.authentication.sap.hana.ondemand.com',
			description: 'SAP AI Core Authentication URL',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			required: true,
			default: '',
			placeholder: 'https://api.ai.prod.eu-central-1.aws.ml.hana.ondemand.com',
			description: 'SAP AI Core Base URL',
		},
		{
			displayName: 'Resource Group',
			name: 'resourceGroup',
			type: 'string',
			default: 'default',
			description: 'SAP AI Core Resource Group',
		},
	];

	async preAuthentication(this: IHttpRequestHelper, credentials: ICredentialDataDecryptedObject) {
		const params = new URLSearchParams({
			grant_type: 'client_credentials',
			client_id: credentials.clientId as string,
			client_secret: credentials.clientSecret as string,
		});

		const { access_token } = (await this.helpers.httpRequest({
			method: 'POST',
			url: `${credentials.authUrl}/oauth/token`,
			body: params.toString(),
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		})) as { access_token: string };
		return { sessionToken: access_token };
	}

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.sessionToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/v2/lm/deployments',
			headers: {
				'AI-Resource-Group': '={{$credentials.resourceGroup}}',
			},
		},
	};
}
