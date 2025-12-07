<script setup lang="ts">
import { ref, onMounted } from 'vue'
import QueryForm from './components/QueryForm.vue'
import ResultsTable from './components/ResultsTable.vue'
import { fetchNodes } from './services/registry'
import { queryAllNodes } from './services/nodes'
import type { VamdcNode, NodeResponse, QueryParams } from './types/vamdc'

const nodes = ref<VamdcNode[]>([])
const results = ref<NodeResponse[]>([])
const querying = ref(false)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    nodes.value = await fetchNodes()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load nodes'
  } finally {
    loading.value = false
  }
})

async function handleQuery(params: QueryParams) {
  querying.value = true
  results.value = nodes.value.map(node => ({
    nodeId: node.id,
    nodeName: node.name,
    status: 'pending' as const
  }))

  await queryAllNodes(nodes.value, params, (response) => {
    const index = results.value.findIndex(r => r.nodeId === response.nodeId)
    if (index >= 0) {
      results.value[index] = response
    }
  })

  querying.value = false
}
</script>

<template>
  <div id="app">
    <header>
      <h1>VAMDC Portal</h1>
      <p v-if="loading">Loading nodes from registry...</p>
      <p v-else-if="error" class="error">{{ error }}</p>
      <p v-else>{{ nodes.length }} nodes available</p>
    </header>

    <main>
      <QueryForm @query="handleQuery" :disabled="querying || loading" />
      <ResultsTable :results="results" :in-progress="querying" />
    </main>
  </div>
</template>

<style scoped>
#app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}

header {
  margin-bottom: 1.5rem;
}

header h1 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

header p {
  margin: 0;
  color: #666;
}

.error {
  color: #c62828;
}
</style>
