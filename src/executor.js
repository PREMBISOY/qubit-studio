import { StabilizerSimulator } from './stabilizer.js';
import { ExactSimulator } from './exact.js';
import { CLIFFORD_GATES } from './circuit.js';

export function makeSimulator(circuit, mode, random = Math.random) { return mode === 'exact' ? new ExactSimulator(circuit.qubitCount, random) : new StabilizerSimulator(circuit.qubitCount, random); }
export function validateCircuit(circuit, mode) { if (mode === 'exact' && circuit.qubitCount > 12) throw new Error('Exact state-vector mode is limited to 12 qubits.'); if (mode === 'stabilizer') for (const g of circuit.moments.flat()) if (!CLIFFORD_GATES.has(g.name)) throw new Error(`${g.name} is non-Clifford. Use Exact mode (up to 12 qubits) for this gate.`); }
export function applyNoise(sim, targets, rate, random = Math.random) { if (!rate) return; for (const q of new Set(targets)) if (random() < rate) { const p = Math.floor(random() * 3); sim.apply({ name: p === 0 ? 'X' : p === 1 ? 'Y' : 'Z', targets: [q] }); } }
export function execute(circuit, mode, { noise = 0, random = Math.random, steps = Infinity } = {}) {
  validateCircuit(circuit, mode); const sim = makeSimulator(circuit, mode, random); let done = 0;
  outer: for (const moment of circuit.moments) for (const g of moment) { if (done >= steps) break outer; sim.apply(g); applyNoise(sim, [...(g.targets || []), ...(g.controls || [])], noise, random); done++; }
  return { sim, done };
}
export function runShots(circuit, mode, shots, { noise = 0, random = Math.random } = {}) {
  validateCircuit(circuit, mode); const results = [], counts = new Map(), ones = Array(circuit.qubitCount).fill(0), pairs = Array.from({ length: circuit.qubitCount }, () => Array(circuit.qubitCount).fill(0));
  for (let shot = 0; shot < shots; shot++) { const { sim } = execute(circuit, mode, { noise, random }); const bits = circuit.measuredQubits.map(q => sim.measure(q)); const key = bits.join(''); results.push(bits); counts.set(key, (counts.get(key) || 0) + 1); bits.forEach((bit, index) => { if (bit) ones[circuit.measuredQubits[index]]++; }); for (let a = 0; a < bits.length; a++) for (let b = a + 1; b < bits.length; b++) if (bits[a] === bits[b]) { pairs[circuit.measuredQubits[a]][circuit.measuredQubits[b]]++; pairs[circuit.measuredQubits[b]][circuit.measuredQubits[a]]++; } }
  return { results, counts, probabilities: ones.map(v => v / shots), equalRates: pairs.map(row => row.map(v => v / shots)) };
}
