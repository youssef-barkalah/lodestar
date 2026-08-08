import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDir = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile(name) {
  const file = join(backendDir, name);
  if (!existsSync(file)) return;
  const content = readFileSync(file, 'utf8');
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile('.env');

export const config = {
  port: Number(process.env.PORT || 3001),
  searxngUrl: (process.env.SEARXNG_URL || 'http://localhost:8080').replace(
    /\/+$/,
    ''
  ),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  maxQueryLength: Number(process.env.MAX_QUERY_LENGTH || 200),
  searchTimeout: Number(process.env.SEARCH_TIMEOUT || 20000),
  providerTimeout: Number(process.env.PROVIDER_TIMEOUT || 10000),
  youtubeApiKey: process.env.YOUTUBE_API_KEY || '',
  supabaseUrl: (process.env.SUPABASE_URL || '').replace(/\/+$/, ''),
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRole: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};
