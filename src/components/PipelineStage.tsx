import { motion } from "framer-motion";
import { GitBranch, Hammer, ShieldCheck, Rocket, CheckCircle2, Loader2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export type StageStatus = "success" | "running" | "queued" | "failed" | "pending";

export interface Stage {
  id: string;
  name: string;
  provider: string;
  status: StageStatus;
  duration: string;
  icon: "source" | "build" | "approve" | "deploy";
}

const iconMap = {
  source: GitBranch,
  build: Hammer,
  approve: ShieldCheck,
  deploy: Rocket,
};

const statusMeta: Record<StageStatus, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  success: { label: "Succeeded", cls: "text-primary border-primary/40 bg-primary/5", Icon: CheckCircle2 },
  running: { label: "In progress", cls: "text-accent border-accent/40 bg-accent/5 ring-glow-accent", Icon: Loader2 },
  queued:  { label: "Queued",      cls: "text-muted-foreground border-border bg-secondary/40", Icon: Clock },
  failed:  { label: "Failed",      cls: "text-destructive border-destructive/40 bg-destructive/5", Icon: XCircle },
  pending: { label: "Pending",     cls: "text-muted-foreground border-border bg-secondary/40", Icon: Clock },
};

export const PipelineStage = ({ stage, index }: { stage: Stage; index: number }) => {
  const Icon = iconMap[stage.icon];
  const meta = statusMeta[stage.status];
  const StatusIcon = meta.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className={cn(
        "relative flex-1 min-w-[180px] rounded-xl border p-4 bg-card-gradient backdrop-blur-sm",
        meta.cls
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-background/60 p-2 border border-border">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Stage {index + 1}
            </p>
            <p className="text-sm font-semibold text-foreground">{stage.name}</p>
          </div>
        </div>
        <StatusIcon className={cn("h-4 w-4 shrink-0", stage.status === "running" && "animate-spin")} />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider opacity-80">
          {stage.provider}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">{stage.duration}</span>
      </div>

      {stage.status === "running" && (
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-background/60">
          <div className="h-full w-1/3 animate-flow rounded-full" />
        </div>
      )}
    </motion.div>
  );
};
