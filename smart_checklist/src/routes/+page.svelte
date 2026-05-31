<script lang="ts">
	let { data } = $props();
	let newName = $state('');
	let generating = $state(false);
	let prompt = $state('');
	let aiError = $state('');
</script>

<div class="space-y-12">
	<section>
		<h1 class="text-3xl font-bold tracking-tight text-surface-900 mb-8">Your Checklists</h1>

		{#if data.checklists.length === 0}
			<p class="text-surface-400">No checklists yet. Create one below.</p>
		{:else}
			<ul class="space-y-1">
				{#each data.checklists as checklist}
					<li class="flex items-center justify-between py-3 border-b border-surface-200 group">
						<a href="/checklist/{checklist.id}" class="text-surface-900 hover:text-surface-500 no-underline">
							{checklist.name}
						</a>
						<form method="POST" action="?/delete">
							<input type="hidden" name="id" value={checklist.id} />
							<button type="submit" class="text-surface-400 hover:text-surface-900 text-sm opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
						</form>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section>
		<h2 class="text-sm font-medium text-surface-400 uppercase tracking-wide mb-4">New Checklist</h2>
		<form method="POST" action="?/create" class="flex gap-3">
			<input
				type="text"
				name="name"
				bind:value={newName}
				placeholder="Checklist name..."
				class="flex-1 px-4 py-2.5 bg-white border border-surface-300 rounded-lg text-surface-900 placeholder-surface-400 focus:outline-none focus:border-surface-900 transition-colors"
			/>
			<button
				type="submit"
				disabled={!newName.trim()}
				class="px-5 py-2.5 bg-surface-900 text-white rounded-lg font-medium hover:bg-surface-700 disabled:bg-surface-200 disabled:text-surface-400 transition-colors"
			>
				Create
			</button>
		</form>
	</section>

	<section>
		<h2 class="text-sm font-medium text-surface-400 uppercase tracking-wide mb-2">Generate with AI</h2>
		<p class="text-surface-500 text-sm mb-4">Describe what you need and AI will generate a checklist for you.</p>
		<form
			onsubmit={async (e) => {
				e.preventDefault();
				if (!prompt.trim() || generating) return;
				generating = true;
				aiError = '';
				try {
					const res = await fetch('/api/generate', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ prompt: prompt.trim() })
					});
					const result = await res.json();
					if (result.redirectTo) {
						window.location.href = result.redirectTo;
					} else if (result.error) {
						aiError = result.error;
					}
				} catch {
					aiError = 'Failed to connect to AI service.';
				} finally {
					generating = false;
				}
			}}
			class="flex gap-3"
		>
			<input
				type="text"
				bind:value={prompt}
				placeholder="e.g. Plan a camping trip..."
				class="flex-1 px-4 py-2.5 bg-white border border-surface-300 rounded-lg text-surface-900 placeholder-surface-400 focus:outline-none focus:border-surface-900 transition-colors"
			/>
			<button
				type="submit"
				disabled={!prompt.trim() || generating}
				class="px-5 py-2.5 bg-surface-900 text-white rounded-lg font-medium hover:bg-surface-700 disabled:bg-surface-200 disabled:text-surface-400 transition-colors"
			>
				{generating ? 'Generating...' : 'Generate'}
			</button>
		</form>
		{#if aiError}
			<p class="text-red-500 text-sm mt-3">{aiError}</p>
		{/if}
	</section>
</div>
