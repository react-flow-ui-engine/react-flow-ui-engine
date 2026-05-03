# @react-flow-ui-engine/core

Framework-agnostic flow orchestration for UI journeys, onboarding flows, setup wizards, and conditional screens.

## Install

```bash
pnpm add @react-flow-ui-engine/core
```

```bash
npm install @react-flow-ui-engine/core
```

## What it provides

- Typed flow definitions
- Step transitions
- Event-based navigation
- Conditional guards
- Permission rules
- Validation hooks
- Same-screen conditional content resolution
- No React dependency

## Basic usage

```ts
import { createFlowEngine } from '@react-flow-ui-engine/core';

const flow = {
  id: 'signup',
  initial: 'welcome',
  context: {
    plan: 'free'
  },
  steps: {
    welcome: {
      next: 'choose-plan'
    },
    'choose-plan': {
      on: {
        CONTINUE: [
          {
            when: (ctx) => ctx.plan !== 'free',
            goTo: 'billing'
          },
          {
            goTo: 'finish'
          }
        ]
      }
    },
    billing: {
      next: 'finish'
    },
    finish: {}
  }
};

const engine = createFlowEngine(flow);

await engine.next();
engine.setContext({ plan: 'pro' });
await engine.send({ type: 'CONTINUE' });
```

## Conditional content

```ts
import { resolveVisibleBlocks } from '@react-flow-ui-engine/core';

const blocks = resolveVisibleBlocks(
  [
    {
      id: 'upgrade',
      type: 'cta',
      props: { title: 'Upgrade' },
      visibleIf: (ctx) => ctx.plan === 'free'
    }
  ],
  { plan: 'free' }
);
```

## API highlights

| API | Purpose |
| --- | --- |
| `createFlowEngine(flow, options?)` | Create a stateful flow engine. |
| `engine.next(patch?)` | Move to the current step's `next` target. |
| `engine.back()` | Move back using explicit back target or history. |
| `engine.goTo(stepId)` | Navigate to a specific step. |
| `engine.send(event)` | Run an event transition from the current step. |
| `engine.setContext(patch)` | Update flow context. |
| `engine.subscribe(listener)` | Subscribe to state changes. |
| `resolveVisibleBlocks(blocks, context)` | Filter same-page content blocks by `visibleIf`. |
| `resolveVisibleContent(content, context)` | Return content with filtered blocks. |

## License

MIT
