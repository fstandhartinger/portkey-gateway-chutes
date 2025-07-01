import { ProviderConfigs } from '../types';
import ChutesAPIConfig from './api';
import {
  chatCompleteParams,
  completeParams,
  embedParams,
  responseTransformers,
} from '../open-ai-base';
import { CHUTES } from '../../globals';

const ChutesConfig: ProviderConfigs = {
  api: ChutesAPIConfig,
  chatComplete: chatCompleteParams([], {}),
  complete: completeParams([], {}),
  embed: embedParams([], {}),
  responseTransforms: responseTransformers(CHUTES, {
    chatComplete: true,
    complete: true,
    embed: true,
  }),
};

export default ChutesConfig;
