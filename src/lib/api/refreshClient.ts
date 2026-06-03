import axios from 'axios';
import { env } from '../env';

// Separate instance used exclusively for token refresh.
// NO request/response interceptors — adding them would cause an infinite loop
// when the access token is expired and we try to refresh it.
export const refreshClient = axios.create({
  baseURL: env.VITE_API_BASE_URL + '/api/v1',
  withCredentials: true, // Required to send the HttpOnly refresh cookie
});
