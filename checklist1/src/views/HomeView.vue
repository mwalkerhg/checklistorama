<script setup lang="ts">
import { ref } from 'vue'
import { useChecklistStore } from '@/stores/checklist'

const store = useChecklistStore()
const newName = ref('')

function createChecklist() {
  const trimmed = newName.value.trim()
  if (trimmed) {
    store.addChecklist(trimmed)
    newName.value = ''
  }
}
</script>

<template>
  <div>
    <h1>My Checklists</h1>

    <form @submit.prevent="createChecklist">
      <input v-model="newName" placeholder="New checklist name..." />
      <button type="submit">Create</button>
    </form>

    <p v-if="store.checklists.length === 0">No checklists yet. Create one above!</p>

    <ul>
      <li v-for="checklist in store.checklists" :key="checklist.id">
        <RouterLink :to="`/checklist/${checklist.id}`">{{ checklist.name }}</RouterLink>
        <span> ({{ checklist.items.length }} items) </span>
        <button @click="store.removeChecklist(checklist.id)">Delete</button>
      </li>
    </ul>
  </div>
</template>
