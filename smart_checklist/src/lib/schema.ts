import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const checklists = sqliteTable('checklists', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	createdAt: text('created_at').default('CURRENT_TIMESTAMP')
});

export const items = sqliteTable('items', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	checklistId: integer('checklist_id')
		.notNull()
		.references(() => checklists.id, { onDelete: 'cascade' }),
	text: text('text').notNull(),
	checked: integer('checked', { mode: 'boolean' }).default(false)
});

export const checklistsRelations = relations(checklists, ({ many }) => ({
	items: many(items)
}));

export const itemsRelations = relations(items, ({ one }) => ({
	checklist: one(checklists, {
		fields: [items.checklistId],
		references: [checklists.id]
	})
}));
