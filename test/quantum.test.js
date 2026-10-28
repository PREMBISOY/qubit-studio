import test from 'node:test';
import assert from 'node:assert/strict';
import { StabilizerSimulator } from '../src/stabilizer.js';
import { ExactSimulator } from '../src/exact.js';
import { emptyCircuit, gate, addGate, examples, serializeCircuit, deserializeCircuit } from '../src/circuit.js';
import { runShots, execute, validateCircuit } from '../src/executor.js';

function sequence(values) { let i = 0; return () => values[i++ % values.length]; }
test('X flips |0> to |1>', () => { const sim = new StabilizerSimulator(1); sim.xGate(0); assert.equal(sim.measure(0), 1); });
test('Hadamard measurements are balanced over deterministic random values', () => { let sim = new StabilizerSimulator(1, sequence([.1, .9])); sim.h(0); assert.equal(sim.measure(0), 0); sim = new StabilizerSimulator(1, sequence([.9])); sim.h(0); assert.equal(sim.measure(0), 1); });
test('H then H returns |0>', () => { const sim = new StabilizerSimulator(1); sim.h(0); sim.h(0); assert.equal(sim.measure(0), 0); });
test('H Z H returns |1>', () => { const sim = new StabilizerSimulator(1); sim.h(0); sim.zGate(0); sim.h(0); assert.equal(sim.measure(0), 1); });
test('Y, reset, swap, CZ, and CNOT preserve their expected computational outcomes', () => { const sim = new StabilizerSimulator(3); sim.y(0); sim.swap(0, 1); sim.cnot(1, 2); sim.cz(1, 2); assert.equal(sim.measure(0), 0); assert.equal(sim.measure(1), 1); assert.equal(sim.measure(2), 1); sim.reset(1); assert.equal(sim.measure(1), 0); });
test('Bell pair only produces equal outcomes', () => { const circuit = examples('bell'); const out = runShots(circuit, 'stabilizer', 200); assert.deepEqual([...out.counts.keys()].sort(), ['00', '11']); });
test('100-qubit GHZ only produces all zero or all one without noise', () => { const circuit = examples('ghz100'); const out = runShots(circuit, 'stabilizer', 20); assert.ok([...out.counts.keys()].every(bits => /^0{100}$|^1{100}$/.test(bits))); });
test('Pauli noise changes ideal GHZ outcomes with deterministic error', () => { const circuit = examples('ghz100'); const noisy = runShots(circuit, 'stabilizer', 1, { noise: 1, random: () => 0 }); assert.equal(noisy.results[0].length, 100); assert.ok(!/^0{100}$|^1{100}$/.test(noisy.results[0].join(''))); });
test('circuit serialization round trip retains structure', () => { const c = emptyCircuit(3); addGate(c, gate('H', [0])); addGate(c, gate('CNOT', [1], [0])); assert.deepEqual(deserializeCircuit(serializeCircuit(c)), c); });
test('measurement output length matches requested measured qubits', () => { const c = emptyCircuit(8); c.measuredQubits = [0, 3, 7]; const out = runShots(c, 'stabilizer', 4); assert.ok(out.results.every(x => x.length === 3)); });
test('exact state-vector supports T and retains normalized probabilities', () => { const sim = new ExactSimulator(1); sim.h(0); sim.t(0); const p = sim.probabilityOne(0); assert.ok(Math.abs(p - .5) < 1e-12); });
test('exact state-vector supports arbitrary rotations', () => { const sim = new ExactSimulator(1); sim.ry(0, Math.PI); assert.ok(Math.abs(sim.probabilityOne(0) - 1) < 1e-12); sim.rz(0, .37); assert.ok(Math.abs(sim.probabilityOne(0) - 1) < 1e-12); });
test('Bloch vector reports the correct state direction', () => { const sim = new ExactSimulator(1); let v = sim.blochVector(0); assert.ok(Math.abs(v.z - 1) < 1e-12); sim.h(0); v = sim.blochVector(0); assert.ok(Math.abs(v.x - 1) < 1e-12 && Math.abs(v.y) < 1e-12 && Math.abs(v.z) < 1e-12); sim.zGate(0); v = sim.blochVector(0); assert.ok(Math.abs(v.x + 1) < 1e-12); });
test('stabilizer mode rejects a non-Clifford T gate', () => { const c = emptyCircuit(1); addGate(c, gate('T', [0])); assert.throws(() => validateCircuit(c, 'stabilizer'), /non-Clifford/); });
test('stepping executes the requested prefix', () => { const c = emptyCircuit(1); addGate(c, gate('X', [0])); const { sim, done } = execute(c, 'stabilizer', { steps: 1 }); assert.equal(done, 1); assert.equal(sim.measure(0), 1); });
