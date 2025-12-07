<template>
  <div class="results">
    <div v-if="inProgress" class="progress">
      <p>Querying {{ total }} nodes... {{ completed }}/{{ total }} complete</p>
      <progress :value="completed" :max="total"></progress>
    </div>

    <table v-if="results.length > 0">
      <thead>
        <tr>
          <th>Node</th>
          <th>Status</th>
          <th>Species</th>
          <th>States</th>
          <th>Transitions</th>
          <th>Download</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="result in results" :key="result.nodeId" :class="result.status">
          <td>{{ result.nodeName }}</td>
          <td>
            <span :class="`status-${result.status}`">
              {{ result.status }}
            </span>
          </td>
          <td>{{ result.numSpecies ?? '-' }}</td>
          <td>{{ result.numStates ?? '-' }}</td>
          <td>{{ result.numTransitions ?? '-' }}</td>
          <td>
            <a v-if="result.downloadUrl && result.status === 'success'" :href="result.downloadUrl" target="_blank">
              Download XSAMS
            </a>
            <span v-else-if="result.error" class="error-msg">{{ result.error }}</span>
            <span v-else>-</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { NodeResponse } from '@/types/vamdc'

const props = defineProps<{
  results: NodeResponse[]
  inProgress: boolean
}>()

const total = computed(() => props.results.length)
const completed = computed(() =>
  props.results.filter(r => r.status !== 'pending').length
)
</script>

<style scoped>
.results {
  padding: 1rem;
}

.progress {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #e8f4fd;
  border-radius: 8px;
}

.progress progress {
  width: 100%;
  height: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background: #f0f0f0;
  font-weight: 600;
}

tr:hover {
  background: #f9f9f9;
}

.status-pending {
  color: #666;
}

.status-success {
  color: #2e7d32;
  font-weight: 500;
}

.status-error {
  color: #c62828;
  font-weight: 500;
}

.status-timeout {
  color: #f57c00;
  font-weight: 500;
}

.error-msg {
  color: #c62828;
  font-size: 0.8rem;
}

a {
  color: #1976d2;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
