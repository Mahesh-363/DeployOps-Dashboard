import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { PipelineStage, type Stage, type StageStatus } from "@/components/PipelineStage";
import { LogsPanel, type LogLine } from "@/components/LogsPanel";
import { ArchitectureMap } from "@/components/ArchitectureMap";
import { DeploymentHistory } from "@/components/DeploymentHistory";
import { seedHistory } from "@/data/deployHistory";
import { Button } from "@/components/ui/button";
import {
  Activity, GitCommit, RotateCcw, Play, Bell, Server, Cpu, MemoryStick,
  TrendingUp, CheckCircle2, AlertTriangle, Wrench,
} from "lucide-react";

const initialStages: Stage[] = [
  { id: "src",   name: "Source",   provider: "GitHub · main",       icon: "source",  status: "success", duration: "2s" },
  { id: "build", name: "Build",    provider: "CodeBuild",            icon: "build",   status: "success", duration: "1m 42s" },
  { id: "appr",  name: "Approval", provider: "Manual gate",          icon: "approve", status: "success", duration: "12s" },
  { id: "dep",   name: "Deploy",   provider: "CodeDeploy · EC2",     icon: "deploy",  status: "success", duration: "58s" },
];

const seedLogs: LogLine[] = [
  { ts: "10:42:01", level: "info", source: "pipeline",  msg: "Source change detected — commit 9f3a1c by alice@deployops.io" },
  { ts: "10:42:03", level: "info", source: "codebuild", msg: "Provisioning build container aws/codebuild/amazonlinux2-x86_64-standard:5.0" },
  { ts: "10:42:18", level: "info", source: "codebuild", msg: "$ npm ci  →  installed 1284 packages in 38s" },
  { ts: "10:42:58", level: "info", source: "codebuild", msg: "$ npm test  →  142 passed, 0 failed" },
  { ts: "10:43:21", level: "info", source: "codebuild", msg: "$ npm run build  →  bundle 412 KB (gzip 124 KB)" },
  { ts: "10:43:43", level: "ok",   source: "codedeploy",msg: "ApplicationStop hook executed on i-0a91…dev" },
  { ts: "10:43:51", level: "info", source: "codedeploy",msg: "BeforeInstall: rotating /home/ec2-user/app → app_old" },
  { ts: "10:44:12", level: "info", source: "codedeploy",msg: "AfterInstall: npm ci --omit=dev (319 pkgs)" },
  { ts: "10:44:31", level: "info", source: "codedeploy",msg: "ApplicationStart: pm2 start npm --name webapp" },
  { ts: "10:44:38", level: "ok",   source: "validate",  msg: "Health check GET /health → 200 OK in 412ms" },
  { ts: "10:44:39", level: "ok",   source: "pipeline",  msg: "Deployment d-78AB91 succeeded — released 9f3a1c to prod" },
];

const Index = () => {
  const [env, setEnv] = useState<"dev" | "prod">("prod");
  const [stages, setStages] = useState<Stage[]>(initialStages);
  const [logs, setLogs] = useState<LogLine[]>(seedLogs);
  const [history] = useState(seedHistory);
  const [running, setRunning] = useState(false);
  const [metrics, setMetrics] = useState({ cpu: 34, mem: 58, rps: 142 });

  // Live metric jitter
  useEffect(() => {
    const id = setInterval(() => {
      setMetrics((m) => ({
        cpu: Math.max(8, Math.min(92, m.cpu + (Math.random() - 0.5) * 8)),
        mem: Math.max(20, Math.min(90, m.mem + (Math.random() - 0.5) * 4)),
        rps: Math.max(60, Math.min(420, Math.round(m.rps + (Math.random() - 0.5) * 30))),
      }));
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const pushLog = useCallback((l: LogLine) => {
    setLogs((prev) => [...prev.slice(-80), l]);
  }, []);

  const now = () =>
    new Date().toLocaleTimeString("en-GB", { hour12: false });

  const setStage = (id: string, status: StageStatus, duration?: string) => {
    setStages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status, duration: duration ?? s.duration } : s))
    );
  };

  const runPipeline = async () => {
    if (running) return;
    setRunning(true);
    setStages(initialStages.map((s) => ({ ...s, status: "queued" as StageStatus, duration: "—" })));
    pushLog({ ts: now(), level: "info", source: "pipeline", msg: `Triggering ${env} pipeline · branch ${env === "prod" ? "main" : "develop"}` });

    const seq: Array<[string, number, string]> = [
      ["src", 1200, "3s"],
      ["build", 2600, "1m 51s"],
      ["appr", env === "prod" ? 1800 : 0, env === "prod" ? "8s" : "skipped"],
      ["dep", 2200, "1m 04s"],
    ];

    for (const [id, delay, dur] of seq) {
      if (delay === 0) { setStage(id, "success", dur); continue; }
      setStage(id, "running");
      pushLog({ ts: now(), level: "info", source: id, msg: `${id} stage started…` });
      await new Promise((r) => setTimeout(r, delay));
      setStage(id, "success", dur);
      pushLog({ ts: now(), level: "ok", source: id, msg: `${id} stage completed in ${dur}` });
    }

    pushLog({ ts: now(), level: "ok", source: "pipeline", msg: `Release succeeded → http://ec2-${env}.aws.amazonaws.com:3000` });
    setRunning(false);
  };

  const triggerRollback = async () => {
    pushLog({ ts: now(), level: "warn",  source: "cloudwatch", msg: "Alarm webapp-5xx-high → ALARM (threshold breached)" });
    pushLog({ ts: now(), level: "warn",  source: "codedeploy", msg: "Auto-rollback initiated → previous revision r-77F2" });
    setStage("dep", "running");
    await new Promise((r) => setTimeout(r, 1800));
    setStage("dep", "success", "rolled back");
    pushLog({ ts: now(), level: "ok", source: "codedeploy", msg: "Rollback complete — traffic restored to r-77F2" });
    pushLog({ ts: now(), level: "ok", source: "sns", msg: "Notification sent to devops-alerts@deployops.io" });
  };

  const lastDeploy = {
    commit: "9f3a1c",
    author: "alice",
    msg: "feat(api): add /health latency histogram",
    when: "2 min ago",
  };

  return (
    <div className="min-h-screen text-foreground">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-md sticky top-0 z-30">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-9 w-9 rounded-lg pipe-gradient flex items-center justify-center font-mono font-bold text-primary-foreground ring-glow">
                ⌬
              </div>
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">DeployOps Console</h1>
              <p className="font-mono text-[11px] text-muted-foreground">aws · eu-west-1 · webapp</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 rounded-full border border-border bg-secondary/40 p-1">
            {(["dev", "prod"] as const).map((e) => (
              <button
                key={e}
                onClick={() => setEnv(e)}
                className={`relative font-mono text-xs uppercase tracking-wider px-4 py-1.5 rounded-full transition-colors ${
                  env === e ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {env === e && (
                  <motion.span
                    layoutId="env-pill"
                    className="absolute inset-0 rounded-full pipe-gradient"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{e}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse-dot" />
              healthy
            </span>
            <Link to="/builder">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Wrench className="h-3.5 w-3.5" /> Builder
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={triggerRollback} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> Rollback
            </Button>
            <Button size="sm" onClick={runPipeline} disabled={running} className="gap-1.5 ring-glow">
              <Play className="h-3.5 w-3.5" /> {running ? "Running…" : "Run pipeline"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Hero strip */}
        <section className="grid gap-4 md:grid-cols-4">
          <HeroCard
            label="Last deployment"
            value={lastDeploy.commit}
            sub={`${lastDeploy.author} · ${lastDeploy.when}`}
            icon={GitCommit}
            tone="primary"
          />
          <HeroCard
            label="Pipeline success rate"
            value="98.4%"
            sub="last 50 runs"
            icon={TrendingUp}
            tone="accent"
          />
          <HeroCard
            label="MTTR"
            value="3m 12s"
            sub="auto-rollback enabled"
            icon={CheckCircle2}
            tone="primary"
          />
          <HeroCard
            label="Open alarms"
            value="0"
            sub="CloudWatch · SNS active"
            icon={AlertTriangle}
            tone="warning"
          />
        </section>

        {/* Pipeline */}
        <section className="rounded-2xl border border-border bg-card-gradient p-6 shadow-card">
          <div className="flex items-end justify-between mb-5 flex-wrap gap-2">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                CodePipeline · webapp-{env}-pipeline
              </p>
              <h2 className="text-xl font-semibold mt-0.5">
                <span className="text-glow">{lastDeploy.commit}</span>{" "}
                <span className="text-muted-foreground font-normal text-base">
                  — {lastDeploy.msg}
                </span>
              </h2>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              total · 2m 47s
            </span>
          </div>

          <div className="flex items-stretch gap-3 flex-wrap lg:flex-nowrap">
            {stages.map((s, i) => (
              <div key={s.id} className="flex items-stretch gap-3 flex-1 min-w-[180px]">
                <PipelineStage stage={s} index={i} />
                {i < stages.length - 1 && (
                  <div className="hidden lg:flex items-center">
                    <div className="h-0.5 w-6 animate-flow rounded-full" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Architecture + Metrics */}
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ArchitectureMap />
          </div>

          <div className="space-y-4">
            <MetricCard icon={Cpu}        label="CPU"        value={`${metrics.cpu.toFixed(0)}%`} pct={metrics.cpu} />
            <MetricCard icon={MemoryStick} label="Memory"    value={`${metrics.mem.toFixed(0)}%`} pct={metrics.mem} />
            <MetricCard icon={Activity}   label="Requests/s" value={`${metrics.rps}`} pct={(metrics.rps / 420) * 100} />
          </div>
        </section>

        {/* Logs + Targets */}
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <LogsPanel logs={logs} />
          </div>

          <div className="rounded-xl border border-border bg-card-gradient p-5 shadow-card space-y-4">
            <div>
              <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Deploy targets
              </h3>
              <p className="text-base font-semibold mt-0.5">EC2 fleet</p>
            </div>

            {[
              { id: "i-0a91b2", env: "prod", ip: "54.221.18.42",  status: "healthy" },
              { id: "i-0a91b3", env: "prod", ip: "54.221.18.43",  status: "healthy" },
              { id: "i-0d12c4", env: "dev",  ip: "18.232.91.10",  status: "healthy" },
            ].map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-border bg-background/40 p-3">
                <div className="flex items-center gap-3">
                  <Server className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-mono text-xs">{t.id}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {t.env} · {t.ip}
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot" />
                  {t.status}
                </span>
              </div>
            ))}

            <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 flex gap-3">
              <Bell className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-warning">SNS notifications</p>
                <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
                  devops-alerts@deployops.io
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="pt-4 pb-2 text-center font-mono text-[11px] text-muted-foreground">
          DeployOps · CodePipeline → CodeBuild → CodeDeploy · auto-rollback armed
        </footer>
      </main>
    </div>
  );
};

const HeroCard = ({
  label, value, sub, icon: Icon, tone,
}: {
  label: string; value: string; sub: string;
  icon: typeof Activity; tone: "primary" | "accent" | "warning";
}) => {
  const toneCls = {
    primary: "text-primary border-primary/30",
    accent:  "text-accent border-accent/30",
    warning: "text-warning border-warning/30",
  }[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-border bg-card-gradient p-5 shadow-card"
    >
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className={`rounded-md border p-1.5 ${toneCls}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight font-mono">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </motion.div>
  );
};

const MetricCard = ({
  icon: Icon, label, value, pct,
}: {
  icon: typeof Activity; label: string; value: string; pct: number;
}) => {
  const danger = pct > 80;
  return (
    <div className="rounded-xl border border-border bg-card-gradient p-4 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-accent" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
        <span className={`font-mono text-sm font-semibold ${danger ? "text-warning" : "text-foreground"}`}>{value}</span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-background/60">
        <motion.div
          animate={{ width: `${Math.min(100, pct)}%` }}
          transition={{ duration: 0.8 }}
          className={`h-full rounded-full ${danger ? "bg-warning" : "pipe-gradient"}`}
        />
      </div>
    </div>
  );
};

export default Index;
