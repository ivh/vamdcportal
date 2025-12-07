export interface VamdcNode {
  id: string
  name: string
  tapEndpoint: string
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
  wavelengthMin: number
  wavelengthMax: number
}
