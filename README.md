# Qubit Studio

An interactive companion for the 14-slide, eight-presenter introduction to a single qubit.

## Run locally

```powershell
npm test
npm start
```

Open the local address printed by the server (normally `http://127.0.0.1:4173`).

## Deploy on Vercel

This project is a static site in production: the interactive lab and its quantum
calculations run in the visitor's browser. `server.js` is only a local-development
server, so Vercel does not need a server function or a database.

1. Push this folder to a GitHub, GitLab, or Bitbucket repository.
2. In the [Vercel dashboard](https://vercel.com/new), import that repository.
3. Leave the framework preset as **Other** and leave the build command and output
   directory empty.
4. Click **Deploy**.

Vercel will serve `index.html` at the deployment URL and the browser will load
`src/app.js`, `styles.css`, and `ppt-theme.css` directly. The included
`vercel.json` enables clean URLs and adds a small response-security header.

For a command-line deployment after signing in to Vercel:

```powershell
npx vercel --prod
```

## What it covers

- A slide navigator aligned with all eight speakers and 14 presentation slides
- State-vector notation, spin-½, Pauli expectation values, and the Bloch sphere
- Reversible H, X, Z, and π/2 rotations with an exact single-qubit state-vector model
- Born-rule measurement sampling over 200 shots
- A simple physical T1 relaxation and T2 dephasing model that turns a pure Bloch vector into a mixed state
- A compact comparison of superconducting, ion, silicon-spin, and photonic hardware

The underlying quantum engine and tests for the original circuit simulator remain in `src/`; the interface is now deliberately focused on the single-qubit presentation narrative.
