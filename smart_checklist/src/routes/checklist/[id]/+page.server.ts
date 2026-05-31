import { db } from '$lib/server/db';
import { checklists, items } from '$lib/schema';
import { eq } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	const checklist = await db.select().from(checklists).where(eq(checklists.id, id)).get();
	if (!checklist) error(404, 'Checklist not found');

	const checklistItems = await db.select().from(items).where(eq(items.checklistId, id));
	return { checklist, items: checklistItems };
};

export const actions: Actions = {
	addItem: async ({ request, params }) => {
		const data = await request.formData();
		const text = data.get('text')?.toString().trim();
		if (!text) return fail(400, { error: 'Text is required' });

		await db.insert(items).values({ checklistId: Number(params.id), text });
		return { success: true };
	},

	toggleItem: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const checked = data.get('checked') === 'true';

		await db.update(items).set({ checked: !checked }).where(eq(items.id, id));
		return { success: true };
	},

	removeItem: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));

		await db.delete(items).where(eq(items.id, id));
		return { success: true };
	},

	rename: async ({ request, params }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString().trim();
		if (!name) return fail(400, { error: 'Name is required' });

		await db.update(checklists).set({ name }).where(eq(checklists.id, Number(params.id)));
		return { success: true };
	}
};
