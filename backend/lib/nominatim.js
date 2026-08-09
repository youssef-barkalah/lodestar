import { config } from './config.js';

const API = 'https://nominatim.openstreetmap.org/search';
const UA = 'LodestarSearch/1.0 (https://github.com/youssef-barkalah/lodestar)';

export async function searchMaps(query, language) {
  const lang = language && language !== 'any' ? language : 'en';
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    limit: '10',
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.providerTimeout);
  try {
    const res = await fetch(API + '?' + params.toString(), {
      headers: {
        'User-Agent': UA,
        'Accept-Language': lang,
      },
      signal: controller.signal,
    });
    if (!res.ok) return { results: [] };
    const data = await res.json();
    if (!Array.isArray(data)) return { results: [] };

    const results = data
      .filter(function (place) {
        return place && place.lat != null && place.lon != null;
      })
      .map(function (place) {
        const lat = Number(place.lat);
        const lon = Number(place.lon);
        const detail = [place.category, place.type]
          .filter(Boolean)
          .join(' \u00b7 ');
        return {
          title: place.display_name || place.name || '',
          url:
            'https://www.openstreetmap.org/?mlat=' +
            lat +
            '&mlon=' +
            lon +
            '#map=16/' +
            lat +
            '/' +
            lon,
          content: detail,
          lat: lat,
          lon: lon,
          bbox: Array.isArray(place.boundingbox)
            ? place.boundingbox.map(Number)
            : null,
          engines: ['openstreetmap'],
        };
      });

    return { results: results };
  } catch (err) {
    return { results: [] };
  } finally {
    clearTimeout(timer);
  }
}
