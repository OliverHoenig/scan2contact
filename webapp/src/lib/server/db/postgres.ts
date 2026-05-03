import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.schema';

/** Drizzle + postgres-js without SvelteKit (safe for `tsx` CLI scripts). */
export function createDatabase(databaseUrl: string) {
	const client = postgres(databaseUrl);
	return drizzle(client, { schema });
}

export type AppDatabase = ReturnType<typeof createDatabase>;
