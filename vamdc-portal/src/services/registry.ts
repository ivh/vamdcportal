import type { VamdcNode } from '@/types/vamdc'

// Static node list as fallback (registry doesn't support CORS)
// To update: run the SOAP query from command line and regenerate nodes.json
export async function fetchNodes(): Promise<VamdcNode[]> {
  const response = await fetch(import.meta.env.BASE_URL + 'nodes.json')
  
  if (!response.ok) {
    throw new Error(`Failed to load nodes: ${response.statusText}`)
  }
  
  return response.json()
}
