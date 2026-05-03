import React from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

function Docs() {
  return <main className="page"><section className="hero"><p className="eyebrow">react-flow-ui-engine</p><h1>Declarative user journeys for React.</h1><p>Build onboarding, checkout, KYC, setup wizards, and conditional UI flows without scattering navigation rules across components.</p><a href="https://www.npmjs.com/package/@react-flow-ui-engine/react">View npm package</a></section><section><h2>Install</h2><pre>npm install @react-flow-ui-engine/core @react-flow-ui-engine/react</pre></section><section><h2>Packages</h2><div className="grid"><article><h3>Core</h3><p>Framework-agnostic state engine, transitions, validation, and permissions.</p></article><article><h3>React</h3><p>Provider, hook, renderer, React component content blocks, nested flows, and parallel flows.</p></article></div></section><section><h2>Examples</h2><ul><li>Basic Vite example with conditional React component content blocks</li><li>Stripe-style onboarding example</li></ul></section></main>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><Docs /></React.StrictMode>);
