import { env } from '$env/dynamic/private';
import { createDatabase } from './postgres';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

export const db = createDatabase(env.DATABASE_URL);
export { createDatabase } from './postgres';
export type { AppDatabase } from './postgres';
