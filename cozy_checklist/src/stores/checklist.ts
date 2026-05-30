import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

export interface ChecklistItem {
  id: number
  text: string
  checked: boolean
}

export interface Checklist {
  id: number
  name: string
  items: ChecklistItem[]
}

export const useChecklistStore = defineStore('checklists', () => {
  const saved = localStorage.getItem('checklists')
  const loaded: Checklist[] = saved ? JSON.parse(saved) : []

  const checklists = ref<Checklist[]>(loaded)

  let nextId = loaded.reduce((max, c) => Math.max(max, c.id), 0) + 1
  let nextItemId =
    loaded.reduce((max, c) => Math.max(max, ...c.items.map((i) => i.id), 0), 0) + 1

  watch(checklists, (val) => localStorage.setItem('checklists', JSON.stringify(val)), { deep: true })

  function addChecklist(name: string) {
    checklists.value.push({ id: nextId++, name, items: [] })
  }

  function removeChecklist(id: number) {
    checklists.value = checklists.value.filter((c) => c.id !== id)
  }

  function getChecklist(id: number) {
    return checklists.value.find((c) => c.id === id)
  }

  function addItem(checklistId: number, text: string) {
    const checklist = getChecklist(checklistId)
    if (checklist) {
      checklist.items.push({ id: nextItemId++, text, checked: false })
    }
  }

  function toggleItem(checklistId: number, itemId: number) {
    const checklist = getChecklist(checklistId)
    const item = checklist?.items.find((i) => i.id === itemId)
    if (item) {
      item.checked = !item.checked
    }
  }

  function removeItem(checklistId: number, itemId: number) {
    const checklist = getChecklist(checklistId)
    if (checklist) {
      checklist.items = checklist.items.filter((i) => i.id !== itemId)
    }
  }

  return { checklists, addChecklist, removeChecklist, getChecklist, addItem, toggleItem, removeItem }
})
