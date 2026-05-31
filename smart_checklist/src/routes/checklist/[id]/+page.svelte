<script lang="ts">
	let { data } = $props();
	let newItemText = $state('');
</script>

<div class="space-y-8">
	<div class="flex items-center gap-4">
		<a href="/" class="text-surface-400 hover:text-surface-900 transition-colors">&larr;</a>
		<h1 class="text-2xl font-bold tracking-tight text-surface-900">{data.checklist.name}</h1>
	</div>

	<form method="POST" action="?/addItem" class="flex gap-3">
		<input
			type="text"
			name="text"
			bind:value={newItemText}
			placeholder="Add an item..."
			class="flex-1 px-4 py-2.5 bg-white border border-surface-300 rounded-lg text-surface-900 placeholder-surface-400 focus:outline-none focus:border-surface-900 transition-colors"
		/>
		<button
			type="submit"
			disabled={!newItemText.trim()}
			class="px-5 py-2.5 bg-surface-900 text-white rounded-lg font-medium hover:bg-surface-700 disabled:bg-surface-200 disabled:text-surface-400 transition-colors"
		>
			Add
		</button>
	</form>

	{#if data.items.length === 0}
		<p class="text-surface-400">No items yet.</p>
	{:else}
		<ul class="space-y-0.5">
			{#each data.items as item}
				<li class="flex items-center gap-4 py-3 border-b border-surface-200 group">
					<form method="POST" action="?/toggleItem">
						<input type="hidden" name="id" value={item.id} />
						<input type="hidden" name="checked" value={String(item.checked)} />
						<button type="submit" class="w-5 h-5 rounded border {item.checked ? 'bg-surface-900 border-surface-900' : 'border-surface-300 hover:border-surface-900'} flex items-center justify-center transition-colors">
							{#if item.checked}
								<svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
									<path d="M5 13l4 4L19 7" />
								</svg>
							{/if}
						</button>
					</form>
					<span class="flex-1 {item.checked ? 'line-through text-surface-400' : 'text-surface-900'}">{item.text}</span>
					<form method="POST" action="?/removeItem">
						<input type="hidden" name="id" value={item.id} />
						<button type="submit" class="text-surface-300 hover:text-surface-900 text-sm opacity-0 group-hover:opacity-100 transition-opacity">Remove</button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
</div>
