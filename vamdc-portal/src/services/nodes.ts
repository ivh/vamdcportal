import type { VamdcNode, NodeResponse, QueryParams } from '@/types/vamdc'

function buildQueryString(params: QueryParams): string {
  return `SELECT * WHERE RadTransWavelength >= ${params.wavelengthMin} AND RadTransWavelength <= ${params.wavelengthMax}`
}

function buildDownloadUrl(tapEndpoint: string, queryString: string): string {
  const encoded = encodeURIComponent(queryString)
  return `${tapEndpoint}sync?LANG=VSS2&REQUEST=doQuery&FORMAT=XSAMS&QUERY=${encoded}`
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

    // Parse VAMDC-* headers (case-insensitive)
    const getHeader = (name: string): number => {
      const value = response.headers.get(name)
      return value ? parseInt(value, 10) : 0
    }

    const numSpecies = getHeader('VAMDC-COUNT-SPECIES')
    const numStates = getHeader('VAMDC-COUNT-STATES')
    const numTransitions = getHeader('VAMDC-COUNT-RADIATIVE')

    return {
      nodeId: node.id,
      nodeName: node.name,
      status: 'success',
      numSpecies,
      numStates,
      numTransitions,
      downloadUrl: url
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
