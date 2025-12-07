<template>
  <div class="query-form">
    <h2>Query VAMDC Nodes</h2>
    <form @submit.prevent="handleSubmit">
      <div class="field">
        <label for="wlMin">Wavelength Min (Å):</label>
        <input
          id="wlMin"
          v-model.number="wavelengthMin"
          type="number"
          step="0.01"
          min="0"
          required
        />
      </div>
      <div class="field">
        <label for="wlMax">Wavelength Max (Å):</label>
        <input
          id="wlMax"
          v-model.number="wavelengthMax"
          type="number"
          step="0.01"
          min="0"
          required
        />
      </div>
      <button type="submit" :disabled="disabled">Query Nodes</button>
    </form>
    <p v-if="queryString" class="query-preview">
      Query: <code>{{ queryString }}</code>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { QueryParams } from '@/types/vamdc'

const props = defineProps<{
  disabled?: boolean
}>()

const wavelengthMin = ref<number>(4000)
const wavelengthMax = ref<number>(5000)

const emit = defineEmits<{
  query: [params: QueryParams]
}>()

const queryString = computed(() => {
  if (!wavelengthMin.value || !wavelengthMax.value) return ''
  return `SELECT * WHERE RadTransWavelength >= ${wavelengthMin.value} AND RadTransWavelength <= ${wavelengthMax.value}`
})

function handleSubmit() {
  emit('query', {
    wavelengthMin: wavelengthMin.value,
    wavelengthMax: wavelengthMax.value
  })
}
</script>

<style scoped>
.query-form {
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.field {
  margin-bottom: 0.75rem;
}

.field label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.field input {
  padding: 0.5rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 150px;
}

button {
  background: #4a90d9;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 0.5rem;
}

button:hover:not(:disabled) {
  background: #357abd;
}

button:disabled {
  background: #999;
  cursor: not-allowed;
}

.query-preview {
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #666;
}

.query-preview code {
  background: #e0e0e0;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}
</style>
