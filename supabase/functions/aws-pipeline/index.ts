const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Realistic mock data for demo without AWS credentials
const mockPipelines = [
  { name: 'webapp-prod-pipeline', created: '2026-03-15T10:00:00Z', updated: '2026-04-22T10:44:39Z', version: 3 },
  { name: 'webapp-dev-pipeline', created: '2026-03-15T10:05:00Z', updated: '2026-04-22T09:12:00Z', version: 5 },
  { name: 'api-backend-pipeline', created: '2026-04-01T08:00:00Z', updated: '2026-04-21T16:30:00Z', version: 2 },
];

function randomStatus() {
  const r = Math.random();
  if (r < 0.7) return 'Succeeded';
  if (r < 0.85) return 'InProgress';
  if (r < 0.95) return 'Failed';
  return 'Stopped';
}

function mockPipelineState(name: string) {
  return {
    pipelineName: name,
    stageStates: [
      {
        stageName: 'Source',
        latestExecution: { status: 'Succeeded' },
        actionStates: [{
          actionName: 'GitHub-Source',
          latestExecution: { status: 'Succeeded', lastStatusChange: new Date(Date.now() - 180000).toISOString(), summary: 'Commit 9f3a1c by alice@deployops.io' },
        }],
      },
      {
        stageName: 'Build',
        latestExecution: { status: 'Succeeded' },
        actionStates: [{
          actionName: 'CodeBuild-Build',
          latestExecution: { status: 'Succeeded', lastStatusChange: new Date(Date.now() - 120000).toISOString(), summary: '142 tests passed, bundle 412KB' },
        }],
      },
      {
        stageName: 'Approval',
        latestExecution: { status: 'Succeeded' },
        actionStates: [{
          actionName: 'Manual-Approval',
          latestExecution: { status: 'Succeeded', lastStatusChange: new Date(Date.now() - 90000).toISOString(), summary: 'Approved by alice' },
        }],
      },
      {
        stageName: 'Deploy',
        latestExecution: { status: 'Succeeded' },
        actionStates: [{
          actionName: 'CodeDeploy-Deploy',
          latestExecution: { status: 'Succeeded', lastStatusChange: new Date(Date.now() - 30000).toISOString(), summary: 'Deployed to 3 instances' },
        }],
      },
    ],
  };
}

function mockExecutions(pipelineName: string) {
  const commits = ['9f3a1c', 'b4e2d7', 'c8f1a3', '1d9e5b', 'a2c7f4', 'e6b3d8', 'f1a9c2', '7d4e6b', '3c8a1f', '5b2d9e'];
  const authors = ['alice', 'bob', 'carol', 'dave', 'eve'];
  const messages = [
    'feat(api): add /health latency histogram',
    'fix(auth): token refresh race condition',
    'chore: bump dependencies',
    'feat(ui): dashboard metrics panel',
    'fix(deploy): correct healthcheck path',
    'refactor: extract pipeline service',
    'feat(logs): structured JSON logging',
    'fix(ci): parallel test execution',
    'docs: update deployment runbook',
    'feat(monitoring): CloudWatch alarm thresholds',
  ];

  return {
    pipelineExecutionSummaries: commits.map((commit, i) => {
      const start = new Date(Date.now() - (i * 3600000 + Math.random() * 1800000));
      const duration = 120000 + Math.random() * 180000;
      return {
        pipelineExecutionId: `exec-${crypto.randomUUID().slice(0, 8)}`,
        status: i === 0 ? 'Succeeded' : randomStatus(),
        startTime: start.toISOString(),
        lastUpdateTime: new Date(start.getTime() + duration).toISOString(),
        sourceRevisions: [{
          actionName: 'GitHub-Source',
          revisionId: commit,
          revisionSummary: `${authors[i % authors.length]}: ${messages[i]}`,
        }],
        trigger: {
          triggerType: i % 3 === 0 ? 'Webhook' : 'CloudWatchEvent',
          triggerDetail: `arn:aws:codepipeline:eu-west-1:123456789:${pipelineName}`,
        },
      };
    }),
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, pipelineName } = await req.json();

    if (!action) {
      return new Response(JSON.stringify({ error: 'Missing action' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let data: unknown;

    switch (action) {
      case 'listPipelines':
        data = { pipelines: mockPipelines };
        break;
      case 'getPipelineState':
        data = mockPipelineState(pipelineName || 'webapp-prod-pipeline');
        break;
      case 'listPipelineExecutions':
        data = mockExecutions(pipelineName || 'webapp-prod-pipeline');
        break;
      case 'startPipelineExecution':
        data = { pipelineExecutionId: `exec-${crypto.randomUUID().slice(0, 8)}` };
        break;
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Simulate network latency
    await new Promise(r => setTimeout(r, 300 + Math.random() * 400));

    return new Response(JSON.stringify(data), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

Deno.serve(handler);
