/**
 * API config with fallbacks so env vars are never undefined in release builds.
 * react-native-dotenv can sometimes fail to inline .env in production bundle.
 */
import {
  BASE_URL as ENV_BASE_URL,
  REACT_APP_CLOUD_FRONT_URL as ENV_CLOUD_FRONT,
} from '@env';

export const BASE_URL =
  typeof ENV_BASE_URL === 'string' && ENV_BASE_URL.length > 0
    ? ENV_BASE_URL.replace(/\/$/, '') // strip trailing slash
    : 'https://mebo.in';

export const REACT_APP_CLOUD_FRONT_URL =
  typeof ENV_CLOUD_FRONT === 'string' && ENV_CLOUD_FRONT.length > 0
    ? ENV_CLOUD_FRONT
    : 'https://innovative-lifts.blr1.cdn.digitaloceanspaces.com';
