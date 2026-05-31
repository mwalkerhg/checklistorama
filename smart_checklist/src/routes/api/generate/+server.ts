import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { checklists, items } from '$lib/schema';
import type { RequestHandler } from './$types';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

export const POST: RequestHandler = async ({ request }) => {
	const { prompt } = await request.json();
	if (!prompt?.trim()) {
		return json({ error: 'Prompt is required' }, { status: 400 });
	}

	let response;
	try {
		response = await fetch(`${OLLAMA_URL}/api/chat`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: MODEL,
				stream: false,
				format: 'json',
				messages: [
					{
						role: 'user',
						content: `Generate a checklist for: "${prompt}". Return JSON with keys "name" (string title) and "items" (array of 5-15 practical, actionable strings).`
					}
				]
			})
		});
	} catch {
		return json({ error: 'AI service unavailable. Is Ollama running?' }, { status: 503 });
	}

	if (!response.ok) {
		return json({ error: 'AI service unavailable. Is Ollama running?' }, { status: 503 });
	}

	const result = await response.json();
	const content = result.message?.content || '';

	let generated;
	try {
		const jsonMatch = content.match(/\{[\s\S]*\}/);
		if (!jsonMatch) throw new Error('No JSON found');
		generated = JSON.parse(jsonMatch[0]);
	} catch {
		return json({ error: 'Failed to parse AI response' }, { status: 500 });
	}

	const [checklist] = await db.insert(checklists).values({ name: generated.name }).returning();

	if (generated.items?.length) {
		await db.insert(items).values(
			generated.items.map((text: string) => ({
				checklistId: checklist.id,
				text
			}))
		);
	}

	return json({ redirectTo: `/checklist/${checklist.id}` });
};
