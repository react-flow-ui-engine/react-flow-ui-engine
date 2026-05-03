import { defineFlow, type FlowContext } from '@react-flow-ui-engine/core';
import { FlowContentBlocks, FlowProvider, FlowRenderer, useFlow, type FlowPageProps, type FlowContentBlockComponentProps } from '@react-flow-ui-engine/react';

type DemoContext = FlowContext & {
  accountType?: 'business' | 'personal';
  hasTeam?: boolean;
};

function InfoCard({ title, body }: FlowContentBlockComponentProps<DemoContext> & { title?: string; body?: string }) {
  return (
    <div style={{ margin: '12px 0', padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

function SelectPage({ flow }: FlowPageProps<DemoContext>) {
  return (
    <section>
      <h1>Basic flow example</h1>
      <p>Select an account type. The flow decides which page to render.</p>
      <FlowContentBlocks
        renderBlock={(block) => (
          <div style={{ margin: '12px 0', padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
            <strong>{String(block.props?.title ?? block.type)}</strong>
            <p>{String(block.props?.body ?? '')}</p>
          </div>
        )}
      />
      <button onClick={() => flow.send({ type: 'SELECT', value: 'business' })}>Business</button>{' '}
      <button onClick={() => flow.send({ type: 'SELECT', value: 'personal' })}>Personal</button>
    </section>
  );
}

function BusinessPage({ flow }: FlowPageProps<DemoContext>) {
  return (
    <section>
      <h1>Business page</h1>
      <pre>{JSON.stringify(flow.context, null, 2)}</pre>
      <button onClick={() => flow.back()}>Back</button>
    </section>
  );
}

function PersonalPage({ flow }: FlowPageProps<DemoContext>) {
  return (
    <section>
      <h1>Personal page</h1>
      <pre>{JSON.stringify(flow.context, null, 2)}</pre>
      <button onClick={() => flow.back()}>Back</button>
    </section>
  );
}

function DebugPanel() {
  const flow = useFlow<DemoContext>();

  return (
    <aside style={{ marginTop: 32, padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
      <h2>Debug state</h2>
      <pre>{JSON.stringify(flow.state, null, 2)}</pre>
    </aside>
  );
}

const demoFlow = defineFlow<DemoContext>({
  id: 'basic-demo',
  initial: 'select',
  context: { hasTeam: true },
  steps: {
    select: {
      component: SelectPage,
      content: {
        blocks: [
          {
            id: 'team-note',
            type: 'InfoCard',
            component: InfoCard,
            visibleIf: (ctx) => ctx.hasTeam === true,
            props: {
              title: 'Team setup enabled',
              body: 'This React component block is rendered on the same page only when ctx.hasTeam is true.',
            },
          },
          {
            id: 'personal-note',
            type: 'InfoCard',
            visibleIf: (ctx) => ctx.accountType === 'personal',
            props: {
              title: 'Personal account selected',
              body: 'Conditional content can react to context before navigation happens.',
            },
          },
        ],
      },
      on: {
        SELECT: [
          {
            when: (_ctx, event) => event.value === 'business',
            set: (_ctx, event) => ({ accountType: event.value as 'business' }),
            goTo: 'business',
          },
          {
            when: (_ctx, event) => event.value === 'personal',
            set: (_ctx, event) => ({ accountType: event.value as 'personal' }),
            goTo: 'personal',
          },
        ],
      },
    },
    business: { component: BusinessPage, back: 'select' },
    personal: { component: PersonalPage, back: 'select' },
  },
});

export default function App() {
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <FlowProvider flow={demoFlow}>
        <FlowRenderer />
        <DebugPanel />
      </FlowProvider>
    </main>
  );
}
