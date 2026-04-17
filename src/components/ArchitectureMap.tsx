import { GitBranch, Server, Cloud, Bell, Activity, Database } from "lucide-react";

const nodes = [
  { x: 4,  y: 50, label: "GitHub",      icon: GitBranch, color: "text-foreground" },
  { x: 22, y: 50, label: "CodePipeline", icon: Cloud,     color: "text-accent" },
  { x: 42, y: 30, label: "CodeBuild",    icon: Server,    color: "text-primary" },
  { x: 42, y: 70, label: "S3 Artifacts", icon: Database,  color: "text-muted-foreground" },
  { x: 64, y: 50, label: "CodeDeploy",   icon: Cloud,     color: "text-accent" },
  { x: 84, y: 30, label: "EC2 Dev",      icon: Server,    color: "text-primary" },
  { x: 84, y: 70, label: "EC2 Prod",     icon: Server,    color: "text-primary-glow" },
  { x: 96, y: 90, label: "SNS",         icon: Bell,       color: "text-warning" },
  { x: 96, y: 10, label: "CloudWatch",  icon: Activity,   color: "text-accent" },
];

const edges = [
  [0,1],[1,2],[1,3],[2,4],[3,4],[4,5],[4,6],[5,8],[6,8],[5,7],[6,7],
];

export const ArchitectureMap = () => {
  return (
    <div className="rounded-xl border border-border bg-card-gradient p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Architecture</h3>
          <p className="text-base font-semibold text-foreground">AWS Pipeline Topology</p>
        </div>
        <span className="font-mono text-[10px] text-primary border border-primary/30 rounded-full px-2 py-0.5 bg-primary/5">
          LIVE
        </span>
      </div>

      <div className="relative h-[280px] w-full overflow-hidden rounded-lg bg-background/40 border border-border">
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="edge" x1="0" x2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          {edges.map(([a, b], i) => (
            <line
              key={i}
              x1={nodes[a].x}
              y1={nodes[a].y}
              x2={nodes[b].x}
              y2={nodes[b].y}
              stroke="url(#edge)"
              strokeWidth="0.4"
              strokeDasharray="1.2 1"
            >
              <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="3s" repeatCount="indefinite" />
            </line>
          ))}
        </svg>

        {nodes.map((n, i) => {
          const Icon = n.icon;
          return (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5"
              style={{ left: `${n.x}%`, top: `${n.y}%` }}
            >
              <div className={`rounded-lg border border-border bg-card p-2 ${n.color} shadow-card`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                {n.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
