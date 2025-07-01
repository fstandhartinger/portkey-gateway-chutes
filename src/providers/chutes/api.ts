import { ProviderAPIConfig } from '../types';

const ChutesAPIConfig: ProviderAPIConfig = {
  getBaseURL: () => 'https://llm.chutes.ai',
  headers: ({ providerOptions }) => {
    return {
      Authorization: `Bearer ${providerOptions.apiKey}`,
    };
  },
  getEndpoint: ({ fn }) => {
    switch (fn) {
      case 'chatComplete':
        return '/v1/chat/completions';
      case 'complete':
        return '/v1/completions';
      case 'embed':
        return '/v1/embeddings';
      default:
        return '';
    }
  },
};

export default ChutesAPIConfig;
