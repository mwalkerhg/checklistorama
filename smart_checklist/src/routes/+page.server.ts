import { db } from '$lib/server/db';
import { checklists } from '$lib/schema';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allChecklists = await db.select().from(checklists);
	return { checklists: allChecklists };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString().trim();
		if (!name) return fail(400, { error: 'Name is required' });

		const result = await db.insert(checklists).values({ name }).returning();
		redirect(303, `/checklist/${result[0].id}`);
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		if (!id) return fail(400, { error: 'Invalid id' });

		const { eq } = await import('drizzle-orm');
		await db.delete(checklists).where(eq(checklists.id, id));
		return { success: true };
	}
};
