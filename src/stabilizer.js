// Aaronson-Gottesman style tableau. Each row represents a signed Hermitian Pauli.
export class StabilizerSimulator {
  constructor(n, random = Math.random) { if (n < 1 || n > 1000) throw new Error('Invalid qubit count'); this.n = n; this.random = random; this.x = Array.from({ length: 2 * n }, () => new Uint8Array(n)); this.z = Array.from({ length: 2 * n }, () => new Uint8Array(n)); this.r = new Uint8Array(2 * n); for (let i = 0; i < n; i++) { this.x[i][i] = 1; this.z[n + i][i] = 1; } }
  clone() { const c = new StabilizerSimulator(this.n, this.random); c.x = this.x.map(row => row.slice()); c.z = this.z.map(row => row.slice()); c.r = this.r.slice(); return c; }
  assertQ(q) { if (!Number.isInteger(q) || q < 0 || q >= this.n) throw new Error(`Invalid qubit q${q}`); }
  h(q) { this.assertQ(q); for (let i = 0; i < 2 * this.n; i++) { this.r[i] ^= this.x[i][q] & this.z[i][q]; [this.x[i][q], this.z[i][q]] = [this.z[i][q], this.x[i][q]]; } }
  xGate(q) { this.assertQ(q); for (let i = 0; i < 2 * this.n; i++) this.r[i] ^= this.z[i][q]; }
  y(q) { this.assertQ(q); for (let i = 0; i < 2 * this.n; i++) this.r[i] ^= this.x[i][q] ^ this.z[i][q]; }
  zGate(q) { this.assertQ(q); for (let i = 0; i < 2 * this.n; i++) this.r[i] ^= this.x[i][q]; }
  s(q) { this.assertQ(q); for (let i = 0; i < 2 * this.n; i++) { this.r[i] ^= this.x[i][q] & this.z[i][q]; this.z[i][q] ^= this.x[i][q]; } }
  cnot(c, t) { this.assertQ(c); this.assertQ(t); if (c === t) throw new Error('CNOT needs two qubits'); for (let i = 0; i < 2 * this.n; i++) { this.r[i] ^= this.x[i][c] & this.z[i][t] & (this.x[i][t] ^ this.z[i][c] ^ 1); this.x[i][t] ^= this.x[i][c]; this.z[i][c] ^= this.z[i][t]; } }
  cz(a, b) { this.h(b); this.cnot(a, b); this.h(b); }
  swap(a, b) { this.cnot(a, b); this.cnot(b, a); this.cnot(a, b); }
  // Product of two commuting signed Pauli rows. Formula derives signs with Y = iXZ.
  rowMultiply(dst, src) { let phase = 2 * (this.r[dst] + this.r[src]); for (let q = 0; q < this.n; q++) { const ax = this.x[dst][q], az = this.z[dst][q], bx = this.x[src][q], bz = this.z[src][q]; const rx = ax ^ bx, rz = az ^ bz; phase += ax * az + bx * bz + 2 * az * bx - rx * rz; this.x[dst][q] = rx; this.z[dst][q] = rz; } phase = ((phase % 4) + 4) % 4; if (phase % 2) throw new Error('Non-Hermitian tableau product'); this.r[dst] = phase / 2; }
  measure(q) { this.assertQ(q); let pivot = -1; for (let i = this.n; i < 2 * this.n; i++) if (this.x[i][q]) { pivot = i; break; }
    if (pivot >= 0) { for (let i = 0; i < 2 * this.n; i++) if (i !== pivot && this.x[i][q]) this.rowMultiply(i, pivot); const outcome = this.random() < 0.5 ? 0 : 1; const mate = pivot - this.n; this.x[mate] = this.x[pivot].slice(); this.z[mate] = this.z[pivot].slice(); this.r[mate] = this.r[pivot]; this.x[pivot].fill(0); this.z[pivot].fill(0); this.z[pivot][q] = 1; this.r[pivot] = outcome; return outcome; }
    // Capture relevant destabilizer rows before reusing row zero as temporary space.
    const factors = []; for (let i = 0; i < this.n; i++) if (this.x[i][q]) factors.push(i + this.n);
    const scratch = 0; const sx = this.x[scratch].slice(), sz = this.z[scratch].slice(), sr = this.r[scratch]; this.x[scratch].fill(0); this.z[scratch].fill(0); this.r[scratch] = 0;
    for (const factor of factors) this.rowMultiply(scratch, factor); const outcome = this.r[scratch]; this.x[scratch] = sx; this.z[scratch] = sz; this.r[scratch] = sr; return outcome;
  }
  reset(q) { if (this.measure(q)) this.xGate(q); }
  apply(g) { const t = g.targets || []; const c = g.controls || []; if (g.name === 'H') this.h(t[0]); else if (g.name === 'X') this.xGate(t[0]); else if (g.name === 'Y') this.y(t[0]); else if (g.name === 'Z') this.zGate(t[0]); else if (g.name === 'S') this.s(t[0]); else if (g.name === 'CNOT') this.cnot(c[0], t[0]); else if (g.name === 'CZ') this.cz(c[0], t[0]); else if (g.name === 'SWAP') this.swap(t[0], t[1]); else if (g.name === 'RESET') this.reset(t[0]); else if (g.name === 'MEASURE') return this.measure(t[0]); else throw new Error(`Unsupported stabilizer gate ${g.name}`); }
}
