<script lang="ts">
	import '../app.css';
	import brain from '$lib/assets/brain.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={brain} />
</svelte:head>

<div class="min-h-screen bg-white text-surface-900">
	<header class="border-b border-surface-200 py-5">
		<div class="max-w-2xl mx-auto px-6 flex items-center gap-3">
			<img src={brain} alt="" class="w-6 h-6" />
			<a href="/" class="text-lg font-medium text-surface-900 no-underline tracking-tight">Smart Checklist</a>
		</div>
	</header>
	<main class="max-w-2xl mx-auto px-6 py-10">
		{@render children()}
	</main>
</div>
