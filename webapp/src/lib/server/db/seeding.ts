import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { eq } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import type { AppDatabase } from './postgres';
import { account, user } from './schema/auth.schema';
import { mailTemplate } from './schema/mailTemplates.schema';

/** Local / dev-only sign-in (inserted directly; not validated against signup rules). */
export const DEMO_EMAIL = 'test@test.com';
export const DEMO_PASSWORD = 'test';

/** Demo rows for `mail_template` when the demo user has none yet. */
export const DEMO_MAIL_TEMPLATES = [
	{
		displayName: '[Demo] Quick hello',
		subject: 'Great meeting you',
		body: 'Hi {firstName},\n\nGreat meeting you today — here is my contact in case you need anything.\n\nBest,\nDemo'
	},
	{
		displayName: '[Demo] Schedule a call',
		subject: 'Next steps',
		body: 'Hi {firstName},\n\nWould you be open to a short follow-up call next week? Pick a slot that works for you.\n\nThanks,\nDemo'
	},
	{
		displayName: '[Demo] Share materials',
		subject: 'As discussed',
		body: 'Hi {firstName},\n\nAs discussed, I am sharing a quick summary and the link we talked about.\n\nRegards,\nDemo'
	}
] as const;

export type SeedDemoUserResult = {
	userId: string;
	createdUser: boolean;
	insertedMailTemplates: number;
};

/**
 * Idempotent seed: ensures a Better Auth user + credential account and a few mail templates.
 * Safe to call multiple times (skips user if email exists; templates only if the user has none).
 *
 * Pass `db` from `$lib/server/db` in the app, or use `npm run db:seed` (loads `.env` via `dotenv`).
 */
export async function seedDemoUser(database: AppDatabase): Promise<SeedDemoUserResult> {
	const email = DEMO_EMAIL.toLowerCase();

	const [existingUser] = await database.select().from(user).where(eq(user.email, email)).limit(1);

	let userId: string;
	let createdUser = false;

	if (existingUser) {
		userId = existingUser.id;
	} else {
		userId = crypto.randomUUID();
		const accountRowId = crypto.randomUUID();
		const passwordHash = await hashPassword(DEMO_PASSWORD);

		await database.transaction(async (tx) => {
			await tx.insert(user).values({
				id: userId,
				name: 'Demo User',
				email,
				emailVerified: true,
				image: null
			});
			// Better Auth `linkAccount` uses `accountId === user.id` for the credential provider.
			await tx.insert(account).values({
				id: accountRowId,
				accountId: userId,
				providerId: 'credential',
				userId,
				password: passwordHash,
				accessToken: null,
				refreshToken: null,
				idToken: null,
				accessTokenExpiresAt: null,
				refreshTokenExpiresAt: null,
				scope: null
			});
		});
		createdUser = true;
	}

	const [existingTemplate] = await database
		.select({ id: mailTemplate.id })
		.from(mailTemplate)
		.where(eq(mailTemplate.userId, userId))
		.limit(1);

	let insertedMailTemplates = 0;
	if (!existingTemplate) {
		const rows = DEMO_MAIL_TEMPLATES.map((t) => ({
			id: crypto.randomUUID(),
			userId,
			displayName: t.displayName,
			subject: t.subject,
			body: t.body
		}));
		await database.insert(mailTemplate).values(rows);
		insertedMailTemplates = rows.length;
	}

	return { userId, createdUser, insertedMailTemplates };
}

async function runSeedCli(): Promise<void> {
	const { config } = await import('dotenv');
	config({ path: '.env' });

	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error('DATABASE_URL is not set. Add it to webapp/.env or export it before running db:seed.');
	}

	const { createDatabase } = await import('./postgres');
	const database = createDatabase(url);
	try {
		const result = await seedDemoUser(database);
		console.log(JSON.stringify(result, null, 2));
	} catch (err) {
		const code = err && typeof err === 'object' && 'cause' in err && err.cause &&
			typeof err.cause === 'object' && err.cause !== null && 'code' in err.cause
			? String((err.cause as { code?: string }).code)
			: '';
		if (code === '42P01') {
			throw new Error(
				'Database tables are missing (PostgreSQL 42P01). Apply the Drizzle schema first, then seed again:\n' +
					'  cd webapp && npm run db:push\n' +
					'Requires DATABASE_URL in .env (same as for db:seed).'
			);
		}
		throw err;
	}
}

const entry = process.argv[1];
const isDirectRun =
	entry != null &&
	path.resolve(fileURLToPath(import.meta.url)) === path.resolve(entry);

if (isDirectRun) {
	runSeedCli().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
