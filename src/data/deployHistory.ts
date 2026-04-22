import type { DeployRecord } from "@/components/DeploymentHistory";
import type { LogLine } from "@/components/LogsPanel";

const makeLogs = (commit: string, author: string, success: boolean): LogLine[] => {
  const base: LogLine[] = [
    { ts: "10:30:01", level: "info", source: "pipeline", msg: `Source change detected — commit ${commit} by ${author}@deployops.io` },
    { ts: "10:30:03", level: "info", source: "codebuild", msg: "Provisioning build container" },
    { ts: "10:30:18", level: "info", source: "codebuild", msg: "$ npm ci → installed 1284 packages" },
    { ts: "10:30:58", level: "info", source: "codebuild", msg: "$ npm test → 142 passed, 0 failed" },
    { ts: "10:31:21", level: "info", source: "codebuild", msg: "$ npm run build → bundle 412 KB" },
  ];
  if (success) {
    base.push(
      { ts: "10:31:43", level: "ok", source: "codedeploy", msg: "ApplicationStop hook executed" },
      { ts: "10:32:12", level: "ok", source: "codedeploy", msg: "AfterInstall: npm ci --omit=dev" },
      { ts: "10:32:31", level: "ok", source: "codedeploy", msg: "ApplicationStart: pm2 start" },
      { ts: "10:32:38", level: "ok", source: "validate", msg: "Health check GET /health → 200 OK" },
      { ts: "10:32:39", level: "ok", source: "pipeline", msg: `Deployment succeeded — ${commit}` },
    );
  } else {
    base.push(
      { ts: "10:31:43", level: "error", source: "codedeploy", msg: "ApplicationStart failed — exit code 1" },
      { ts: "10:31:55", level: "warn", source: "codedeploy", msg: "Auto-rollback initiated" },
      { ts: "10:32:10", level: "ok", source: "codedeploy", msg: "Rollback complete" },
      { ts: "10:32:11", level: "warn", source: "sns", msg: "Alert sent to devops-alerts@deployops.io" },
    );
  }
  return base;
};

export const seedHistory: DeployRecord[] = [
  {
    id: "d-001", commit: "9f3a1c", author: "alice", branch: "main",
    message: "feat(api): add /health latency histogram",
    duration: "2m 47s", status: "success", when: "2 min ago",
    logs: makeLogs("9f3a1c", "alice", true),
  },
  {
    id: "d-002", commit: "e72b4f", author: "bob", branch: "main",
    message: "fix(auth): refresh token rotation",
    duration: "3m 12s", status: "success", when: "1 hr ago",
    logs: makeLogs("e72b4f", "bob", true),
  },
  {
    id: "d-003", commit: "a1d8c9", author: "carol", branch: "develop",
    message: "chore(deps): bump express to 4.19.2",
    duration: "1m 58s", status: "failed", when: "3 hrs ago",
    logs: makeLogs("a1d8c9", "carol", false),
  },
  {
    id: "d-004", commit: "f4e221", author: "dave", branch: "main",
    message: "feat(ui): dark mode toggle",
    duration: "2m 33s", status: "success", when: "5 hrs ago",
    logs: makeLogs("f4e221", "dave", true),
  },
  {
    id: "d-005", commit: "bb91a7", author: "alice", branch: "main",
    message: "perf(db): add connection pooling",
    duration: "2m 19s", status: "success", when: "8 hrs ago",
    logs: makeLogs("bb91a7", "alice", true),
  },
  {
    id: "d-006", commit: "c3f872", author: "eve", branch: "develop",
    message: "test: add e2e coverage for checkout flow",
    duration: "4m 05s", status: "success", when: "1 day ago",
    logs: makeLogs("c3f872", "eve", true),
  },
];
