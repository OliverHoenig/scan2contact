import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

export const mailTemplate = pgTable(
	'mail_template',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		displayName: text('display_name').notNull(),
		subject: text('subject').notNull(),
		body: text('body').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull()
	},
	(table) => [index('mail_template_user_id_idx').on(table.userId)]
);

export const mailTemplateRelations = relations(mailTemplate, ({ one }) => ({
	user: one(user, {
		fields: [mailTemplate.userId],
		references: [user.id]
	})
}));
