export const CLIFFORD_GATES = new Set(['H', 'X', 'Y', 'Z', 'S', 'CNOT', 'CZ', 'SWAP', 'RESET', 'MEASURE']);
export const EXACT_GATES = new Set([...CLIFFORD_GATES, 'T', 'RX', 'RY', 'RZ']);

export function emptyCircuit(qubitCount = 100) { return { qubitCount, moments: [], measuredQubits: Array.from({ length: qubitCount }, (_, i) => i) }; }
export function gate(name, targets, controls = []) { return { id: crypto.randomUUID(), name, targets, controls }; }
export function addGate(circuit, item, momentIndex = circuit.moments.length) {
  while (circuit.moments.length <= momentIndex) circuit.moments.push([]);
  circuit.moments[momentIndex].push(item); return circuit;
}
export function circuitStats(circuit) {
  const gates = circuit.moments.flat();
  return { depth: circuit.moments.length, gates: gates.length, entangling: gates.filter(g => ['CNOT', 'CZ', 'SWAP'].includes(g.name)).length };
}
export function serializeCircuit(circuit) { return JSON.stringify(circuit); }
export function deserializeCircuit(value) {
  const parsed = JSON.parse(value);
  if (!Number.isInteger(parsed.qubitCount) || parsed.qubitCount < 1 || parsed.qubitCount > 100 || !Array.isArray(parsed.moments)) throw new Error('Invalid circuit data.');
  return parsed;
}
export function examples(name) {
  const small = (moments) => ({ qubitCount: 2, moments, measuredQubits: [0, 1] });
  if (name === 'superposition') return small([[gate('H', [0])]]);
  if (name === 'interference-zero') return small([[gate('H', [0])], [gate('H', [0])]]);
  if (name === 'interference-one') return small([[gate('H', [0])], [gate('Z', [0])], [gate('H', [0])]]);
  if (name === 'bell') return small([[gate('H', [0])], [gate('CNOT', [1], [0])]]);
  if (name === 'uniform100') return { qubitCount: 100, moments: [[...Array.from({ length: 100 }, (_, i) => gate('H', [i]))]], measuredQubits: Array.from({ length: 100 }, (_, i) => i) };
  if (name === 'ghz100' || name === 'noisy-ghz') return { qubitCount: 100, moments: [[gate('H', [0])], ...Array.from({ length: 99 }, (_, i) => [gate('CNOT', [i + 1], [i])])], measuredQubits: Array.from({ length: 100 }, (_, i) => i), noise: name === 'noisy-ghz' ? 0.015 : 0 };
  throw new Error(`Unknown example: ${name}`);
}
