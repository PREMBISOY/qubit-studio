const $ = (id) => document.getElementById(id);
const els = {
  theta: $('theta'),
  phi: $('phi'),
  time: $('time'),
  t1: $('t1'),
  t2: $('t2'),
  stateLine: $('state-line'),
  stateDot: $('state-dot')
};

let theta = 0;
let phi = 0;
let time = 0;

const deg = (value) => value * Math.PI / 180;
const clean = (value) => Math.abs(value) < .0005 ? 0 : value;

function preparedVector() {
  const polar = deg(theta);
  const phase = deg(phi);
  return {
    x: Math.sin(polar) * Math.cos(phase),
    y: Math.sin(polar) * Math.sin(phase),
    z: Math.cos(polar)
  };
}

function currentState() {
  const vector = preparedVector();
  const t1 = Math.max(1, Number(els.t1.value) || 180);
  const t2 = Math.max(1, Number(els.t2.value) || 110);

  return {
    x: vector.x * Math.exp(-time / t2),
    y: vector.y * Math.exp(-time / t2),
    z: 1 - (1 - vector.z) * Math.exp(-time / t1)
  };
}

function updateLab() {
  const vector = currentState();
  const p1 = Math.max(0, Math.min(1, (1 - vector.z) / 2));
  const p0 = 1 - p1;
  const radius = Math.hypot(vector.x, vector.y, vector.z);
  const purity = (1 + radius ** 2) / 2;

  const centerX = 180;
  const centerY = 160;
  const endX = centerX + 112 * (.78 * vector.x + .28 * vector.y);
  const endY = centerY - 112 * vector.z - 112 * .28 * vector.y;

  els.stateLine.setAttribute('d', `M${centerX} ${centerY} L${endX.toFixed(1)} ${endY.toFixed(1)}`);
  els.stateDot.setAttribute('cx', endX.toFixed(1));
  els.stateDot.setAttribute('cy', endY.toFixed(1));

  $('theta-value').textContent = `${theta}°`;
  $('phi-value').textContent = `${phi}°`;
  $('time-value').textContent = `${time} µs`;
  $('p-zero').textContent = `${(p0 * 100).toFixed(1)}%`;
  $('p-one').textContent = `${(p1 * 100).toFixed(1)}%`;
  $('bar-zero').style.width = `${p0 * 100}%`;
  $('bar-one').style.width = `${p1 * 100}%`;
  $('rx').textContent = clean(vector.x).toFixed(3);
  $('ry').textContent = clean(vector.y).toFixed(3);
  $('rz').textContent = clean(vector.z).toFixed(3);
  $('purity').textContent = purity.toFixed(3);
  $('state-badge').textContent = purity > .995 ? 'Pure state' : purity > .7 ? 'Partly mixed' : 'Mixed state';
  $('state-reading').textContent = `r = (${clean(vector.x).toFixed(2)}, ${clean(vector.y).toFixed(2)}, ${clean(vector.z).toFixed(2)}) · |r| = ${radius.toFixed(2)}`;
}

function setAngles(nextTheta, nextPhi = phi) {
  theta = ((nextTheta % 360) + 360) % 360;
  if (theta > 180) {
    theta = 360 - theta;
    nextPhi += 180;
  }
  phi = ((nextPhi % 360) + 360) % 360;
  els.theta.value = theta;
  els.phi.value = phi;
  time = 0;
  els.time.value = 0;
  updateLab();
}

function applyGate(name) {
  let { x, y, z } = preparedVector();
  if (name === 'H') [x, y, z] = [z, -y, x];
  if (name === 'X') [y, z] = [-y, -z];
  if (name === 'Y') [x, z] = [-x, -z];
  if (name === 'Z') [x, y] = [-x, -y];
  if (name === 'RX90') [y, z] = [-z, y];
  if (name === 'RY90') [x, z] = [z, -x];
  setAngles(Math.acos(Math.max(-1, Math.min(1, z))) * 180 / Math.PI, Math.atan2(y, x) * 180 / Math.PI);
}

function measure() {
  const vector = currentState();
  const p1 = Math.max(0, Math.min(1, (1 - vector.z) / 2));
  const shots = 200;
  let ones = 0;
  for (let i = 0; i < shots; i++) if (Math.random() < p1) ones++;
  $('measurement-result').innerHTML = `<strong>${shots - ones}</strong> zero · <strong>${ones}</strong> one <span>(from ${shots} shots)</span>`;
}

els.theta.addEventListener('input', () => {
  theta = Number(els.theta.value);
  time = 0;
  els.time.value = 0;
  updateLab();
});

els.phi.addEventListener('input', () => {
  phi = Number(els.phi.value);
  time = 0;
  els.time.value = 0;
  updateLab();
});

els.time.addEventListener('input', () => {
  time = Number(els.time.value);
  updateLab();
});

[els.t1, els.t2].forEach((element) => element.addEventListener('input', updateLab));

document.querySelectorAll('[data-preset]').forEach((button) => button.addEventListener('click', () => {
  const preset = button.dataset.preset;
  setAngles(preset === 'zero' ? 0 : preset === 'one' ? 180 : 90, preset === 'minus' ? 180 : 0);
}));

document.querySelectorAll('[data-gate]').forEach((button) => button.addEventListener('click', () => applyGate(button.dataset.gate)));
$('measure').addEventListener('click', measure);

updateLab();
