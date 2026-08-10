const DEFAULT_API_URL = 'http://localhost:3001';
const HOSTED_API_URL = 'https://lodestar-c2zh.onrender.com';
import { t } from './i18n.js';

export const API_URL = (
  window.LODESTAR_API ||
  (location.hostname.endsWith('.github.io')
    ? HOSTED_API_URL
    : DEFAULT_API_URL)
).replace(/\/+$/, '');

export async function fetchCountry(query) {
  try {
    const response = await fetch(
      API_URL + '/api/country?q=' + encodeURIComponent(query),
      { headers: { Accept: 'application/json' } }
    );
    if (!response.ok) return null;
    const body = await response.json();
    return body && body.found ? body : null;
  } catch (err) {
    return null;
  }
}

export async function fetchResults(query, type, page, options) {
  const params = {
    q: query,
    type: type,
    page: page,
  };
  if (options && options.time && options.time !== 'any') {
    params.time = options.time;
  }
  if (options && options.safeSearch) {
    params.safesearch = '1';
  }
  const url =
    API_URL +
    '/api/search?' +
    Object.keys(params)
      .map(function (key) {
        return (
          encodeURIComponent(key) + '=' + encodeURIComponent(params[key])
        );
      })
      .join('&');

  let response;
  try {
    response = await fetch(url, { headers: { Accept: 'application/json' } });
  } catch (err) {
    throw new Error(t('error.network'));
  }

  let body = null;
  try {
    body = await response.json();
  } catch (err) {}

  if (!response.ok) {
    const message =
      body && body.error && body.error.message
        ? body.error.message
        : t('error.generic');
    const error = new Error(message);
    error.code = body && body.error ? body.error.code : 'unknown';
    throw error;
  }

  return body;
}
