import type { VamdcNode } from '@/types/vamdc'

const REGISTRY_URL = 'https://registry.vamdc.org/registry-12.07/services/RegistryQueryv1_0'

const NODEQUERY = `declare namespace ri='http://www.ivoa.net/xml/RegistryInterface/v1.0';
<nodes>
{
   for $x in //ri:Resource
   where $x/capability[@standardID='ivo://vamdc/std/VAMDC-TAP']
   and $x/@status='active'
   return  <node><title>{$x/title/text()}</title><url>{$x/capability[@standardID='ivo://vamdc/std/VAMDC-TAP']/interface/accessURL/text()}</url></node>
}
</nodes>`

function buildSoapEnvelope(xquery: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:rs="http://www.ivoa.net/wsdl/RegistrySearch/v1.0">
  <soap:Body>
    <rs:XQuerySearch>
      <xquery>${xquery}</xquery>
    </rs:XQuerySearch>
  </soap:Body>
</soap:Envelope>`
}

function parseNodesXml(xmlText: string): VamdcNode[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'text/xml')
  const nodes: VamdcNode[] = []
  
  const nodeElements = doc.querySelectorAll('node')
  nodeElements.forEach((el, index) => {
    const title = el.querySelector('title')?.textContent || 'Unknown'
    let url = el.querySelector('url')?.textContent || ''
    
    // Take only first URL if multiple (space-separated)
    url = url.split(' ')[0] ?? ''
    if (url && !url.endsWith('/')) {
      url += '/'
    }
    
    if (url) {
      nodes.push({
        id: `node-${index}`,
        name: title,
        tapEndpoint: url
      })
    }
  })
  
  return nodes
}

export async function fetchNodes(): Promise<VamdcNode[]> {
  const response = await fetch(REGISTRY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': '""'
    },
    body: buildSoapEnvelope(NODEQUERY)
  })
  
  if (!response.ok) {
    throw new Error(`Registry fetch failed: ${response.statusText}`)
  }
  
  const xmlText = await response.text()
  return parseNodesXml(xmlText)
}
