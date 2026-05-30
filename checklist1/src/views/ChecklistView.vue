<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useChecklistStore } from '@/stores/checklist'

const route = useRoute()
const store = useChecklistStore()
const newItemText = ref('')

const checklistId = computed(() => Number(route.params['id']))
const checklist = computed(() => store.getChecklist(checklistId.value))

function addItem() {
  const trimmed = newItemText.value.trim()
  if (trimmed) {
    store.addItem(checklistId.value, trimmed)
    newItemText.value = ''
  }
}
</script>

<template>
  <div v-if="checklist">
    <RouterLink to="/">&larr; Back to all checklists</RouterLink>

    <h1>{{ checklist.name }}</h1>

    <form @submit.prevent="addItem">
      <input v-model="newItemText" placeholder="Add an item..." />
      <button type="submit">Add</button>
    </form>

    <p v-if="checklist.items.length === 0">No items yet. Add one above!</p>

    <ul>
      <li v-for="item in checklist.items" :key="item.id">
        <label>
          <input
            type="checkbox"
            :checked="item.checked"
            @change="store.toggleItem(checklist.id, item.id)"
          />
          <span :style="{ textDecoration: item.checked ? 'line-through' : 'none' }">
            {{ item.text }}
          </span>
        </label>
        <button @click="store.removeItem(checklist.id, item.id)">Remove</button>
      </li>
    </ul>
  </div>

  <div v-else>
    <p>Checklist not found.</p>
    <RouterLink to="/">&larr; Back to all checklists</RouterLink>
  </div>
</template>
