/**
 * Dependency-free DOM-attribute serializer for isolated semantic QA fixtures.
 * This is NOT the Vite/Preact acceptance runner; see chromium-panel-kit-qa.py.
 */
const escapeAttr=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');

export function renderNativeAttributes(attributes){
  return Object.entries(attributes)
    .filter(([key,v])=>v!==undefined&&v!==null&&(v!==false||key.startsWith('aria-')))
    .map(([key,v])=>v===true&&!key.startsWith('aria-')?` ${key}`:` ${key}="${escapeAttr(v)}"`)
    .join('');
}
