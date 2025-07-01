import { ProviderAPIConfig } from '../types';
import models from '../../data/models.json';

const ChutesAPIConfig: ProviderAPIConfig = {
  getBaseURL: ({ params }) => {
    const modelId = params?.model;
    if (!modelId) {
      return 'https://api.chutes.ai';
    }

    const model = (models.data as any[]).find(
      (m: any) => m.id === modelId && m.provider?.id === 'chutes'
    );
    if (model && model.slug) {
      return `https://${model.slug}.chutes.ai`;
    }

    // Fallback or error handling
    return 'https://api.chutes.ai';
  },
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