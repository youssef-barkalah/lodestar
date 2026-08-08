const DEFAULT_API_URL = 'http://localhost:3001';

export const API_URL = (window.LODESTAR_API || DEFAULT_API_URL).replace(
  /\/+$/,
  ''
);

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

export async function fetchResults(query, type, page) {
  const url =
    API_URL +
    '/api/search?q=' +
    encodeURIComponent(query) +
    '&type=' +
    encodeURIComponent(type) +
    '&page=' +
    page;

  let response;
  try {
    response = await fetch(url, { headers: { Accept: 'application/json' } });
  } catch (err) {
    throw new Error(
      "Lodestar couldn't reach the search service. Please try again."
    );
  }

  let body = null;
  try {
    body = await response.json();
  } catch (err) {}

  if (!response.ok) {
    const message =
      body && body.error && body.error.message
        ? body.error.message
        : 'Something went wrong. Please try again.';
    const error = new Error(message);
    error.code = body && body.error ? body.error.code : 'unknown';
    throw error;
  }

  return body;
}
