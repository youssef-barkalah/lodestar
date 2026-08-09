import { config } from './config.js';

const API = 'https://photon.komoot.io/api/';

export async function searchMaps(query, language) {
  const params = new URLSearchParams({ q: query, limit: '10' });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.providerTimeout);
  try {
    const res = await fetch(API + '?' + params.toString(), {
      headers: language && language !== 'any'
        ? { 'Accept-Language': language }
        : {},
      signal: controller.signal,
    });
    if (!res.ok) return { results: [] };
    const data = await res.json();
    if (!data || !Array.isArray(data.features)) return { results: [] };

    const results = data.features
      .filter(function (feature) {
        return (
          feature &&
          feature.geometry &&
          Array.isArray(feature.geometry.coordinates)
        );
      })
      .map(function (feature) {
        const coords = feature.geometry.coordinates;
        const lon = Number(coords[0]);
        const lat = Number(coords[1]);
        const props = feature.properties || {};
        const title = buildTitle(props);
        return {
          title: title,
          url:
            'https://www.openstreetmap.org/?mlat=' +
            lat +
            '&mlon=' +
            lon +
            '#map=16/' +
            lat +
            '/' +
            lon,
          content: props.type || props.osm_value || '',
          lat: lat,
          lon: lon,
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

function buildTitle(props) {
  const parts = [
    props.name,
    props.city !== props.name ? props.city : '',
    props.state !== props.name && props.state !== props.city ? props.state : '',
    props.country,
  ].filter(Boolean);
  return Array.from(new Set(parts)).join(', ');
}
