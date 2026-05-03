import { useState } from 'react';
import { defineFlow, required, minLength, type FlowContext } from '@react-flow-ui-engine/core';
import { FlowContentBlocks, FlowProvider, FlowRenderer, useFlow, type FlowPageProps, type FlowContentBlockComponentProps } from '@react-flow-ui-engine/react';

type Ctx = FlowContext & {
  accountType?: 'solo' | 'company';
  companyName?: string;
  country?: string;
  workspaceId?: string;
  adminEnabled?: boolean;
  docsUploaded?: boolean;
  identityVerified?: boolean;
  payoutAdded?: boolean;
};

const Shell = ({ children }: { children: React.ReactNode }) => {
  const flow = useFlow<Ctx>();

  return (
    <div className="grid">
      <main className="card">{children}</main>
      <aside className="card">
        <span className="badge">{flow.currentStepId}</span>
        <h3>Flow state</h3>
        <pre>{JSON.stringify(flow.state, null, 2)}</pre>
      </aside>
    </div>
  );
};

const InlineNotice = ({ title, body }: FlowContentBlockComponentProps<Ctx> & { title?: string; body?: string }) => {
  return (
    <div className="notice">
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
};

const AccountType = ({ flow }: FlowPageProps<Ctx>) => {
  return (
    <Shell>
      <h1>Stripe-style onboarding</h1>
      <p className="muted">Choose how you will use the product.</p>
      <FlowContentBlocks />
      <button onClick={() => flow.send({ type: 'SELECT_TYPE', value: 'company' })}>
        Company
      </button>
      <button className="secondary" onClick={() => flow.send({ type: 'SELECT_TYPE', value: 'solo' })}>
        Solo
      </button>
    </Shell>
  );
};

const BusinessProfile = ({ flow }: FlowPageProps<Ctx>) => {
  const [companyName, setCompanyName] = useState(flow.context.companyName ?? '');
  const [country, setCountry] = useState(flow.context.country ?? 'AU');

  return (
    <Shell>
      <h2>Business profile</h2>
      <label>Company name</label>
      <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
      <label>Country</label>
      <select value={country} onChange={(e) => setCountry(e.target.value)}>
        <option>AU</option>
        <option>US</option>
        <option>GB</option>
        <option>IN</option>
      </select>
      {flow.state.errors.map((e) => (
        <p className="error" key={e}>
          {e}
        </p>
      ))}
      <button className="secondary" onClick={() => flow.back()}>
        Back
      </button>
      <button
        onClick={() => {
          flow.setContext({ companyName, country });
          void flow.send({ type: 'SAVE_PROFILE' });
        }}
      >
        Continue
      </button>
    </Shell>
  );
};

const CreatingWorkspace = ({ flow }: FlowPageProps<Ctx>) => {
  return (
    <Shell>
      <h2>Create workspace</h2>
      <p className="muted">This simulates an async transition result.</p>
      <p>Status: {flow.state.status}</p>
      <button onClick={() => flow.send({ type: 'CREATE_WORKSPACE' })}>
        Create workspace
      </button>
    </Shell>
  );
};

const AdminSetup = ({ flow }: FlowPageProps<Ctx>) => {
  return (
    <Shell>
      <h2>Admin setup</h2>
      <p>Only admins can access this page.</p>
      <button onClick={() => flow.send({ type: 'ENABLE_ADMIN' })}>
        Enable admin controls
      </button>
    </Shell>
  );
};

const Unauthorized = ({ flow }: FlowPageProps<Ctx>) => {
  return (
    <Shell>
      <h2>Unauthorized</h2>
      <p className="muted">Current user does not have the required role.</p>
      <button onClick={() => flow.goTo('documents')}>Skip admin setup</button>
    </Shell>
  );
};

const UploadDocs = ({ flow }: FlowPageProps<Ctx>) => {
  return (
    <Shell>
      <h2>Nested flow: document verification</h2>
      <p>Upload verification documents.</p>
      <button onClick={() => flow.next({ docsUploaded: true })}>Upload documents</button>
    </Shell>
  );
};

const ReviewDocs = ({ flow }: FlowPageProps<Ctx>) => {
  return (
    <Shell>
      <h2>Review documents</h2>
      <button onClick={() => flow.next({ docsApproved: true })}>Approve documents</button>
    </Shell>
  );
};

const ChildComplete = () => (
  <Shell>
    <h2>Child complete</h2>
  </Shell>
);

const IdentityTask = ({ flow }: FlowPageProps<Ctx>) => {
  return (
    <div className="region">
      <h3>Identity</h3>
      <p className="muted">Parallel region A.</p>
      <button onClick={() => flow.next({ identityVerified: true })}>Verify identity</button>
    </div>
  );
};

const PayoutTask = ({ flow }: FlowPageProps<Ctx>) => {
  return (
    <div className="region">
      <h3>Payouts</h3>
      <p className="muted">Parallel region B.</p>
      <button onClick={() => flow.next({ payoutAdded: true })}>Add payout method</button>
    </div>
  );
};

const RegionComplete = () => (
  <div className="region">
    <h3>Complete</h3>
    <p className="muted">Region finished.</p>
  </div>
);

const Summary = ({ flow }: FlowPageProps<Ctx>) => {
  return (
    <Shell>
      <h2>Onboarding complete</h2>
      <p>Your workspace is ready.</p>
      <pre>{JSON.stringify(flow.context, null, 2)}</pre>
      <button onClick={() => flow.reset()}>Start over</button>
    </Shell>
  );
};

const documentsFlow = defineFlow<Ctx>({
  id: 'documents',
  initial: 'upload',
  context: {},
  steps: {
    upload: { component: UploadDocs, next: 'review' },
    review: { component: ReviewDocs, next: 'done' },
    done: { component: ChildComplete },
  },
});

const identityFlow = defineFlow<Ctx>({
  id: 'identity',
  initial: 'identity',
  context: {},
  steps: {
    identity: { component: IdentityTask, next: 'complete' },
    complete: { component: RegionComplete },
  },
});

const payoutFlow = defineFlow<Ctx>({
  id: 'payout',
  initial: 'payout',
  context: {},
  steps: {
    payout: { component: PayoutTask, next: 'complete' },
    complete: { component: RegionComplete },
  },
});

const onboardingFlow = defineFlow<Ctx>({
  id: 'stripe-style-onboarding',
  initial: 'accountType',
  context: {},
  steps: {
    accountType: {
      component: AccountType,
      content: {
        blocks: [
          {
            id: 'company-guidance',
            type: 'InlineNotice',
            component: InlineNotice,
            visibleIf: (ctx) => ctx.accountType !== 'solo',
            props: {
              title: 'Company onboarding',
              body: 'This notice is a React component content block controlled by visibleIf.',
            },
          },
        ],
      },
      on: {
        SELECT_TYPE: [
          {
            set: (_ctx, e) => ({ accountType: e.value as 'solo' | 'company' }),
            goTo: 'businessProfile',
          },
        ],
      },
    },
    businessProfile: {
      component: BusinessProfile,
      back: 'accountType',
      on: {
        SAVE_PROFILE: [
          {
            validate: [required<Ctx>('companyName'), minLength<Ctx>('companyName', 2)],
            goTo: 'createWorkspace',
          },
        ],
      },
    },
    createWorkspace: {
      component: CreatingWorkspace,
      on: {
        CREATE_WORKSPACE: [
          {
            action: async () => {
              await new Promise((r) => setTimeout(r, 700));
              return {
                set: {
                  workspaceId: `ws_${Math.random().toString(36).slice(2, 8)}`,
                },
                goTo: 'adminSetup',
              };
            },
          },
        ],
      },
    },
    adminSetup: {
      component: AdminSetup,
      permissions: {
        roles: ['admin'],
        fallbackStep: 'unauthorized',
      },
      on: {
        ENABLE_ADMIN: [
          {
            set: { adminEnabled: true },
            goTo: 'documents',
          },
        ],
      },
    },
    unauthorized: { component: Unauthorized },
    documents: {
      flow: documentsFlow,
      next: 'parallelSetup',
      completionMatcher: ({ stepId }) => stepId === 'done',
      onChildComplete: (child) => ({ docsUploaded: Boolean(child.docsUploaded) }),
    },
    parallelSetup: {
      parallel: {
        identity: {
          flow: identityFlow,
          required: true,
          onComplete: (ctx) => ({ identityVerified: Boolean(ctx.identityVerified) }),
        },
        payout: {
          flow: payoutFlow,
          required: true,
          onComplete: (ctx) => ({ payoutAdded: Boolean(ctx.payoutAdded) }),
        },
      },
      next: 'summary',
    },
    summary: { component: Summary },
  },
});

const App = () => {
  return (
    <div className="app-shell">
      <FlowProvider
        flow={onboardingFlow}
        options={{
          user: { id: 'u_1', roles: ['admin'], permissions: ['workspace:write'] },
        }}
      >
        <FlowRenderer />
      </FlowProvider>
    </div>
  );
};

export default App;
