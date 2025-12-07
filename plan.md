# VAMDC Portal Modernization Plan

## Executive Summary

Replace the current Java-based VAMDC portal with a modern, static single-page application (SPA) built with Vue.js. The new portal will run entirely in the browser with no backend server required, taking advantage of existing CORS support in VAMDC nodes.

**MVP Scope**: Simple wavelength query interface that fetches nodes from registry, allows RadTransWavelength range input, executes parallel HEAD requests, and displays results with download URLs.

## Current Portal Analysis

### Architecture
- **Type**: Java-based server application
- **Hosting**: Requires application server
- **UI Pattern**: Server-rendered pages with pop-out subwindows
- **URL**: https://portal.vamdc.eu

### Core Functionality (Complex)
The old portal has extensive functionality including keyword selection, node compatibility trees, autocomplete, and post-processing services. For the MVP, we're simplifying significantly.

## MVP Functionality

The initial version focuses on core workflow only:

1. **Query Registry**
   - On page load, fetch list of VAMDC nodes from registry
   - Display node count and status

2. **Simple Query Builder**
   - Single restrictable field: **RadTransWavelength**
   - Two input fields: Lower bound and Upper bound (in Angstroms)
   - Generate VAMDC query string: `SELECT SPECIES WHERE RadTransWavelength >= X AND RadTransWavelength <= Y`

3. **Query Execution**
   - Click "Query" button
   - Send HEAD requests to all nodes in parallel
   - Show progress (e.g., "Querying 15 nodes... 8/15 complete")
   - Timeout per node: 30 seconds

4. **Results Display**
   - Table with one row per node
   - Columns: Node name, Status, # Species, # States, # Transitions, Download URL
   - Status: Success (green), Error (red), Timeout (yellow)
   - Download URL is a clickable link directly to the node's TAP endpoint

5. **No Complexity**
   - No node capability checking
   - No keyword compatibility trees
   - No autocomplete
   - No saved queries (in MVP)
   - No post-processing services (in MVP)

### Key Insight: CORS Already Enabled

The VAMDC node software already supports CORS:
```python
# From vamdctap/views.py
response['Access-Control-Allow-Origin'] = '*'
response['Access-Control-Allow-Methods'] = 'HEAD'
response['Access-Control-Allow-Headers'] = 'VAMDC'
```

This means browser-based applications can directly query nodes without a backend proxy.

## New Portal Architecture

### Technology Stack

**Frontend Framework**: Vue 3 (Composition API)
- Mature, well-documented
- Batteries included (official router, state management)
- Single-file components
- Excellent TypeScript support
- Similar philosophy to Django (opinionated but flexible)

**Build Tool**: Vite
- Fast development server
- Optimized production builds
- Modern ES modules support

**Language**: TypeScript
- Type safety for complex query state
- Better IDE support
- Self-documenting code

**UI Components**:
- Headless UI or Radix Vue (accessible components)
- TailwindCSS (utility-first styling)
- Or: Vuetify/PrimeVue (comprehensive component library)

**State Management**: Pinia (optional for MVP, can use reactive refs)

**HTTP Client**: Native Fetch API

**Testing**:
- Vitest (unit tests)
- Playwright (E2E tests)

### Deployment
- **Host**: GitHub Pages, Netlify, Cloudflare Pages, or any static host
- **CDN**: Automatic with modern hosts
- **Cost**: Free (static hosting)
- **CI/CD**: GitHub Actions for automated deployment

### Architecture Benefits

**Pure Static SPA:**
- No backend server required
- No server maintenance/patching
- Scales infinitely (CDN-based)
- Works offline (PWA capability)
- Free hosting

**Direct Node Communication:**
- Browser → Registry (get node list)
- Browser → Nodes (HEAD requests for statistics)
- Browser → Nodes (direct download links)

**State Management:**
- Query state in Pinia store
- Saved queries in localStorage
- URL-based query sharing

## Implementation Plan

### Phase 1: Project Setup & Infrastructure (Week 1)

#### 1.1 Initialize Project
```bash
npm create vue@latest vamdc-portal
# Select for MVP: TypeScript (Yes), Router (No), Pinia (No), Vitest (Yes), Playwright (No for now)
# We'll add more later as needed
cd vamdc-portal
npm install
```

#### 1.2 MVP Project Structure (Simplified)
```
vamdc-portal/
├── src/
│   ├── components/          # Vue components
│   │   ├── QueryForm.vue   # Wavelength input form
│   │   ├── ResultsTable.vue # Results display
│   │   └── NodeStatus.vue  # Single node result row
│   ├── services/           # API services
│   │   ├── registry.ts     # Registry API calls
│   │   └── nodes.ts        # Node HEAD request logic
│   ├── types/              # TypeScript types
│   │   └── vamdc.ts        # All VAMDC-related types
│   ├── assets/             # Static assets
│   └── App.vue             # Root component (main app logic here)
├── public/                 # Static files
└── tests/                  # Test files (unit tests only for MVP)
```

#### 1.3 Setup Development Tools
- ESLint + Prettier for code formatting
- Husky for pre-commit hooks
- TypeScript strict mode
- VS Code workspace settings

#### 1.4 Testing Setup
```bash
# Test the dev server
npm run dev
# Should open http://localhost:5173

# Test build process
npm run build
npm run preview
```

**Early Test**: Create a "Hello VAMDC" page, build it, verify it works as static HTML.

### Phase 2: Registry Integration & Types (Day 2-3)

#### 2.1 Research VAMDC Registry API
- Document registry endpoints
- Understand node metadata format
- Test with curl/Postman:
  ```bash
  curl https://registry.vamdc.eu/...
  ```

#### 2.2 Define Types
```typescript
// src/types/vamdc.ts
export interface VamdcNode {
  id: string
  name: string
  tapEndpoint: string
  // Add more fields as discovered from registry
}

export interface NodeResponse {
  nodeId: string
  nodeName: string
  status: 'pending' | 'success' | 'error' | 'timeout'
  numSpecies?: number
  numStates?: number
  numTransitions?: number
  downloadUrl?: string
  error?: string
}

export interface QueryParams {
  wavelengthMin: number  // Angstroms
  wavelengthMax: number  // Angstroms
}
```

#### 2.3 Create Registry Service
```typescript
// src/services/registry.ts
import type { VamdcNode } from '@/types/vamdc'

const REGISTRY_URL = 'https://registry.vamdc.eu/...' // Fill in after research

export async function fetchNodes(): Promise<VamdcNode[]> {
  const response = await fetch(REGISTRY_URL)
  if (!response.ok) {
    throw new Error(`Registry fetch failed: ${response.statusText}`)
  }
  const data = await response.json()
  // Parse and transform to VamdcNode[]
  // This will depend on actual registry format
  return data
}
```

#### 2.4 Test Registry Integration
Add a simple component in App.vue to fetch and display node list:
```typescript
// tests/unit/registry.spec.ts
import { describe, it, expect } from 'vitest'
import { fetchNodes } from '@/services/registry'

describe('Registry Service', () => {
  it('fetches nodes from registry', async () => {
    const nodes = await fetchNodes()
    expect(nodes).toBeInstanceOf(Array)
    expect(nodes.length).toBeGreaterThan(0)
  })
})
```

**Manual Test**:
1. Open browser dev tools → Network tab
2. Run dev server: `npm run dev`
3. Verify registry request succeeds
4. Verify CORS headers present
5. Verify node list displays (just count for now)

### Phase 3: Simple Query Form (Day 4-5)

#### 3.1 Create Query Form Component
```vue
<!-- src/components/QueryForm.vue -->
<template>
  <div class="query-form">
    <h2>Query VAMDC Nodes</h2>
    <form @submit.prevent="handleSubmit">
      <div>
        <label>Wavelength Min (Å):</label>
        <input
          v-model.number="wavelengthMin"
          type="number"
          step="0.01"
          required
        />
      </div>
      <div>
        <label>Wavelength Max (Å):</label>
        <input
          v-model.number="wavelengthMax"
          type="number"
          step="0.01"
          required
        />
      </div>
      <button type="submit">Query Nodes</button>
    </form>
    <p v-if="queryString">
      Query: <code>{{ queryString }}</code>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { QueryParams } from '@/types/vamdc'

const wavelengthMin = ref<number>(4000)
const wavelengthMax = ref<number>(5000)

const emit = defineEmits<{
  query: [params: QueryParams]
}>()

const queryString = computed(() => {
  if (!wavelengthMin.value || !wavelengthMax.value) return ''
  return `SELECT SPECIES WHERE RadTransWavelength >= ${wavelengthMin.value} AND RadTransWavelength <= ${wavelengthMax.value}`
})

function handleSubmit() {
  emit('query', {
    wavelengthMin: wavelengthMin.value,
    wavelengthMax: wavelengthMax.value
  })
}
</script>
```

#### 3.2 Test Query Form
**Manual Test**:
1. Add QueryForm component to App.vue
2. Enter wavelength values
3. Click "Query Nodes"
4. Verify query string displays correctly
5. Verify event emits with correct params

### Phase 4: Query Execution (Day 6-8)

#### 4.1 Query Execution Service
```typescript
// src/services/nodes.ts
import type { VamdcNode, NodeResponse, QueryParams } from '@/types/vamdc'

function buildQueryString(params: QueryParams): string {
  return `SELECT SPECIES WHERE RadTransWavelength >= ${params.wavelengthMin} AND RadTransWavelength <= ${params.wavelengthMax}`
}

function buildDownloadUrl(tapEndpoint: string, queryString: string): string {
  const encoded = encodeURIComponent(queryString)
  return `${tapEndpoint}/sync?LANG=VSS2&REQUEST=doQuery&FORMAT=XSAMS&QUERY=${encoded}`
}

export async function queryNode(
  node: VamdcNode,
  params: QueryParams,
  signal: AbortSignal
): Promise<NodeResponse> {
  const queryString = buildQueryString(params)
  const url = buildDownloadUrl(node.tapEndpoint, queryString)

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal,
      headers: {
        'Accept': 'application/x-xsams+xml'
      }
    })

    if (!response.ok) {
      return {
        nodeId: node.id,
        nodeName: node.name,
        status: 'error',
        error: `HTTP ${response.status}`
      }
    }

    // Parse VAMDC-* headers
    const numSpecies = parseInt(response.headers.get('VAMDC-COUNT-SPECIES') || '0')
    const numStates = parseInt(response.headers.get('VAMDC-COUNT-STATES') || '0')
    const numTransitions = parseInt(response.headers.get('VAMDC-COUNT-RADIATIVE') || '0')

    return {
      nodeId: node.id,
      nodeName: node.name,
      status: 'success',
      numSpecies,
      numStates,
      numTransitions,
      downloadUrl: url.replace('/HEAD', '/GET') // Adjust as needed
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        nodeId: node.id,
        nodeName: node.name,
        status: 'timeout',
        error: 'Request timeout'
      }
    }
    return {
      nodeId: node.id,
      nodeName: node.name,
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}

export async function queryAllNodes(
  nodes: VamdcNode[],
  params: QueryParams,
  onProgress: (response: NodeResponse) => void
): Promise<NodeResponse[]> {
  const timeout = 30000 // 30 seconds per node

  const promises = nodes.map(async (node) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    const response = await queryNode(node, params, controller.signal)
    clearTimeout(timer)
    onProgress(response)
    return response
  })

  return Promise.all(promises)
}
```

#### 4.2 Test Query Execution
Create a simple test in App.vue to verify HEAD requests work:

```typescript
// In App.vue or a test file
import { queryNode } from '@/services/nodes'

// Test with a single node
const testNode = {
  id: 'test',
  name: 'Test Node',
  tapEndpoint: 'https://some-node.vamdc.eu/tap'
}

const result = await queryNode(testNode, {
  wavelengthMin: 4000,
  wavelengthMax: 5000
}, new AbortController().signal)

console.log(result)
```

**Manual Test**:
1. Test against a known working VAMDC node
2. Verify HEAD request sent correctly
3. Check VAMDC-* headers in Network tab
4. Verify statistics parsed correctly
5. Test timeout with slow/dead node

### Phase 5: Results Display (Day 9-10)

#### 5.1 Results Display Components
```vue
<!-- src/components/ResultsTable.vue -->
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
            <a v-if="result.downloadUrl" :href="result.downloadUrl" target="_blank">
              Download XSAMS
            </a>
            <span v-else-if="result.error">{{ result.error }}</span>
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
.status-success { color: green; }
.status-error { color: red; }
.status-timeout { color: orange; }
</style>
```

#### 5.2 Wire Everything Together in App.vue
```vue
<!-- src/App.vue -->
<template>
  <div id="app">
    <header>
      <h1>VAMDC Portal</h1>
      <p v-if="nodes.length">{{ nodes.length }} nodes available</p>
    </header>

    <main>
      <QueryForm @query="handleQuery" />
      <ResultsTable :results="results" :in-progress="querying" />
    </main>
  </div>
</template>

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

onMounted(async () => {
  nodes.value = await fetchNodes()
})

async function handleQuery(params: QueryParams) {
  querying.value = true
  results.value = nodes.value.map(node => ({
    nodeId: node.id,
    nodeName: node.name,
    status: 'pending'
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
```

**Manual Test**:
1. Enter wavelength range
2. Click Query
3. Watch progress bar
4. Verify results table updates in real-time
5. Check download links work
6. Verify error/timeout states display correctly

### Phase 6: Polish & Deploy (Day 11-14)

#### 6.1 Add Basic Styling
- Add TailwindCSS or simple CSS
- Make table responsive
- Add loading spinners
- Improve form layout

#### 6.2 Error Handling
- Handle registry fetch failures
- Show user-friendly error messages
- Add retry mechanism for failed requests

#### 6.3 Testing

```bash
npm run test:unit
```

Write tests for:
- Registry service
- Node query service
- Query string builder

#### 6.4 Build & Deploy

```bash
npm run build
# Test the build locally
npm run preview
```

Deploy to GitHub Pages, Netlify, or Cloudflare Pages:



**Option 1: GitHub Pages**
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

**Option 2: Netlify**
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Option 3: Cloudflare Pages**
- Connect GitHub repo
- Build command: `npm run build`
- Publish directory: `dist`

Test with real queries against live nodes!

## MVP Timeline Summary

- **Days 1**: Project setup
- **Days 2-3**: Registry integration
- **Days 4-5**: Query form
- **Days 6-8**: Query execution logic
- **Days 9-10**: Results display
- **Days 11-14**: Polish and deploy

**Total: ~2 weeks for MVP**

## Post-MVP Enhancements

Once MVP is working, consider adding:

1. **URL-based query sharing** - Encode query params in URL
2. **Multiple restrictables** - Add more fields beyond RadTransWavelength
3. **Saved queries** - localStorage for query history
4. **Node filtering** - Let users select which nodes to query
5. **Export results** - Download results table as CSV
6. **Advanced statistics** - Charts and visualizations
7. **Post-processing services** - Integration with conversion services

## Development Guidelines

### Code Style
- Use TypeScript strict mode
- ESLint + Prettier for consistency
- Vue 3 Composition API (not Options API)
- Prefer composition functions over mixins
- Keep components small and focused

### Naming Conventions
- Components: PascalCase (QueryBuilder.vue)
- Composables: camelCase with "use" prefix (useQueryBuilder)
- Stores: camelCase (useQueryStore)
- Types: PascalCase (QueryKeyword)

### Git Workflow
- Feature branches: `feature/query-builder`
- Bug fixes: `fix/autocomplete-crash`
- Conventional commits: `feat: add autocomplete to species field`
- PR reviews required before merge

### Documentation
- JSDoc comments for public APIs
- README in each major directory
- Inline comments for complex logic
- Keep docs up-to-date with code

## Testing Strategy

### Test Pyramid
- **Many** unit tests (70%): Services, stores, utils, pure functions
- **Some** component tests (20%): UI components with user interactions
- **Few** E2E tests (10%): Critical user workflows

### When to Write Tests
- Before fixing a bug (regression test)
- Alongside new features (TDD when practical)
- For complex business logic (always)
- For public APIs (always)

### Mock Strategy
- Mock external APIs (registry, nodes) in unit tests
- Use real APIs in E2E tests (or staging endpoints)
- Create test fixtures for common data

## Risk Mitigation

### Technical Risks

**Risk**: Registry API changes
- **Mitigation**: Version API calls, add compatibility layer

**Risk**: CORS issues with some nodes
- **Mitigation**: Document unsupported nodes, provide fallback message

**Risk**: Browser compatibility issues
- **Mitigation**: Use polyfills, target modern browsers (last 2 versions)

**Risk**: Performance with many nodes
- **Mitigation**: Pagination, virtual scrolling, request throttling

### Adoption Risks

**Risk**: Users prefer old portal
- **Mitigation**: Feature parity first, improvements second

**Risk**: Missing features in new portal
- **Mitigation**: Thorough feature audit, user testing

**Risk**: Learning curve for contributors
- **Mitigation**: Good documentation, conventional patterns

## Success Metrics

### Technical Metrics
- Lighthouse score > 90
- Load time < 2s
- Time to interactive < 3s
- Query execution time similar to old portal
- Zero critical bugs after launch

### User Metrics
- User adoption rate (track with privacy-friendly analytics)
- Query execution volume
- User feedback/satisfaction
- Issue/bug reports

## Complexity Removed from Full Portal Plan

For MVP, we explicitly removed:
- Node capability checking and compatibility trees
- Color-coded keyword support indicators
- Multiple keyword selection
- Autocomplete for species/values
- Complex query builder UI
- Post-processing service integration
- Saved queries (add post-MVP)
- Advanced filtering and node selection

These can be added incrementally after MVP proves the architecture works.

## Resources

### VAMDC Documentation
- Node software docs: https://vamdc.org/documents/nodesoftware/
- Standards: https://vamdc.org/documents/standards-11.05/
- Registry: https://registry.vamdc.eu/
- Current portal: https://portal.vamdc.eu/

### Vue.js Resources
- Official docs: https://vuejs.org/
- Vue Router: https://router.vuejs.org/
- Pinia: https://pinia.vuejs.org/
- TypeScript with Vue: https://vuejs.org/guide/typescript/

### Development Tools
- Vite: https://vitejs.dev/
- Vitest: https://vitest.dev/
- Playwright: https://playwright.dev/
- TailwindCSS: https://tailwindcss.com/

## Critical Questions to Answer First

Before starting, research these specifics:

1. **Registry API**:
   - Exact endpoint URL for getting node list
   - Response format (XML? JSON?)
   - How to parse node metadata (name, tapEndpoint, etc.)

2. **Node TAP Endpoint**:
   - HEAD request URL format
   - Query parameter name (QUERY=?)
   - Language parameter (LANG=VSS2?)
   - Format parameter (FORMAT=XSAMS?)
   - Example full URL

3. **VAMDC Response Headers**:
   - Header names for statistics (VAMDC-COUNT-SPECIES, etc.)
   - Are headers case-sensitive?
   - What headers are always present vs optional?

4. **RadTransWavelength**:
   - Correct keyword name
   - Units (Angstroms? nm?)
   - Range query syntax

## MVP Getting Started Checklist

- [ ] Research registry API (curl test, document response)
- [ ] Research node HEAD request format (test one node manually)
- [ ] Create new GitHub repository
- [ ] Initialize Vue 3 project: `npm create vue@latest`
- [ ] Create basic project structure (3 components, 2 services, 1 types file)
- [ ] Implement registry service
- [ ] Test registry service (display node count)
- [ ] Implement query form component
- [ ] Implement query execution service
- [ ] Test against one real node
- [ ] Implement results table component
- [ ] Test full workflow with 3-5 nodes
- [ ] Add basic styling
- [ ] Build and deploy to static host
- [ ] Share with team for feedback

---

**Author**: Generated by Claude (Anthropic)
**Date**: 2025-12-07
**Status**: MVP Planning Document (Simplified)
**Next Steps**: Research APIs, create new repository, begin Day 1
