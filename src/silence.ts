/**
 * Silences a benign upstream deprecation notice: react-three-fiber still
 * instantiates THREE.Clock, which three.js now warns about on import.
 *
 * This lives in its own module and is imported *before* anything that pulls in
 * three.js — ES import hoisting means a patch written inline in main.tsx would
 * run only after three.js had already evaluated and logged.
 */
const warn = console.warn
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('THREE.Clock')) return
  warn(...args)
}
