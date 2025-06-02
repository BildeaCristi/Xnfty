/**
 * Converts an IPFS URI to an HTTP gateway URL
 * 
 * @param uri - IPFS URI or other URI to convert
 * @returns HTTP URL that can be used to fetch the resource
 */
const IPFSGatewayURLConverter = (uri: string): string => {
  if (!uri) return '';
  
  // If already an HTTP URL, return as is
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }
  
  // Replace ipfs:// with the gateway URL
  if (uri.startsWith('ipfs://')) {
    const ipfsHash = uri.replace('ipfs://', '');
    return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
  }
  
  // Handle ipfs.io/ipfs/ URLs
  if (uri.startsWith('ipfs.io/ipfs/')) {
    const ipfsHash = uri.replace('ipfs.io/ipfs/', '');
    return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
  }
  
  // If it's just a CID (hash), add the gateway prefix
  if (/^[a-zA-Z0-9]{46}/.test(uri) || /^Qm[a-zA-Z0-9]{44}/.test(uri)) {
    return `https://gateway.pinata.cloud/ipfs/${uri}`;
  }
  
  // Return original if we don't know how to handle it
  return uri;
};

export default IPFSGatewayURLConverter; 