import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Terminal } from "lucide-react";

export interface LogLine {
  ts: string;
  level: "info" | "warn" | "error" | "ok";
  source: string;
  msg: string;
}

const levelColor: Record<LogLine["level"], string> = {
  info: "text-accent",
  warn: "text-warning",
  error: "text-destructive",
  ok: "text-primary",
};

export const LogsPanel = ({ logs }: { logs: LogLine[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [autoscroll] = useState(true);

  useEffect(() => {
    if (autoscroll && ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [logs, autoscroll]);

  return (
    <div className="rounded-xl border border-border bg-card-gradient overflow-hidden shadow-card">
      <div className="flex items-center justify-between border-b border-border bg-background/40 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <h3 className="font-mono text-xs uppercase tracking-wider text-foreground">
            CloudWatch — /aws/codebuild/webapp
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-destructive/70" />
          <span className="h-2 w-2 rounded-full bg-warning/70" />
          <span className="h-2 w-2 rounded-full bg-primary/70 animate-pulse-dot" />
        </div>
      </div>

      <div
        ref={ref}
        className="scanlines h-[340px] overflow-y-auto p-4 font-mono text-[12.5px] leading-relaxed"
      >
        <AnimatePresence initial={false}>
          {logs.map((l, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex gap-3 py-0.5"
            >
              <span className="shrink-0 text-muted-foreground">{l.ts}</span>
              <span className={`shrink-0 w-12 ${levelColor[l.level]} uppercase`}>{l.level}</span>
              <span className="shrink-0 w-28 text-muted-foreground truncate">[{l.source}]</span>
              <span className="text-foreground/90">{l.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div className="flex gap-2 pt-1 text-primary">
          <span>$</span>
          <span className="animate-blink">▌</span>
        </div>
      </div>
    </div>
  );
};
