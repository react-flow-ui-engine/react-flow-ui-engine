# @react-flow-ui-engine/react

React bindings for React Flow UI Engine.

Use it to render declarative flows, onboarding journeys, setup wizards, checkout steps, role-based screens, and conditional content blocks.

## Install

```bash
pnpm add @react-flow-ui-engine/core @react-flow-ui-engine/react
```

```bash
npm install @react-flow-ui-engine/core @react-flow-ui-engine/react
```

## Basic usage

```tsx
import { FlowProvider, FlowRenderer, type FlowPageProps } from '@react-flow-ui-engine/react';

function WelcomePage({ flow }: FlowPageProps) {
  return <button onClick={() => flow.next()}>Start</button>;
}

function DonePage() {
  return <h1>Done</h1>;
}

const flow = {
  id: 'basic',
  initial: 'welcome',
  context: {},
  steps: {
    welcome: {
      component: WelcomePage,
      next: 'done'
    },
    done: {
      component: DonePage
    }
  }
};

export function App() {
  return (
    <FlowProvider flow={flow}>
      <FlowRenderer />
    </FlowProvider>
  );
}
```

## Conditional React content blocks

```tsx
import { FlowContentBlocks, type FlowPageProps } from '@react-flow-ui-engine/react';

function UpgradeCard() {
  return <aside>Upgrade to unlock team features.</aside>;
}

function PlanPage({ flow }: FlowPageProps<{ plan?: string }>) {
  return (
    <main>
      <button onClick={() => flow.setContext({ plan: 'free' })}>Free</button>
      <button onClick={() => flow.setContext({ plan: 'team' })}>Team</button>
      <FlowContentBlocks />
    </main>
  );
}

const flow = {
  id: 'plans',
  initial: 'plan',
  context: {},
  steps: {
    plan: {
      component: PlanPage,
      content: {
        blocks: [
          {
            id: 'upgrade-card',
            type: 'component',
            component: UpgradeCard,
            visibleIf: (ctx) => ctx.plan === 'free'
          }
        ]
      }
    }
  }
};
```

## Exports

| Export | Purpose |
| --- | --- |
| `FlowProvider` | Provides a flow engine to React. |
| `FlowRenderer` | Renders the active step component. |
| `useFlow` | Access state, context, navigation methods, and visible content blocks. |
| `FlowContentBlocks` | Renders visible content blocks for the active step. |
| `FlowPageProps` | Props received by screen components. |
| `FlowContentBlockComponentProps` | Props received by React content block components. |

This package re-exports `@react-flow-ui-engine/core` for convenience.

## License

MIT
