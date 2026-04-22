import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, XCircle, Clock, Play, ChevronDown, ChevronUp, GitCommit,
} from "lucide-react";
import type { LogLine } from "@/components/LogsPanel";

export interface DeployRecord {
  id: string;
  commit: string;
  author: string;
  branch: string;
  message: string;
  duration: string;
  status: "success" | "failed" | "running";
  when: string;
  logs: LogLine[];
}

const statusIcon = {
  success: <CheckCircle2 className="h-3.5 w-3.5 text-primary" />,
  failed: <XCircle className="h-3.5 w-3.5 text-destructive" />,
  running: <Clock className="h-3.5 w-3.5 text-accent animate-spin" />,
};

const statusBadge = {
  success: "border-primary/30 bg-primary/10 text-primary",
  failed: "border-destructive/30 bg-destructive/10 text-destructive",
  running: "border-accent/30 bg-accent/10 text-accent",
};

interface Props {
  history: DeployRecord[];
  onReplayLogs: (logs: LogLine[]) => void;
}

export const DeploymentHistory = ({ history, onReplayLogs }: Props) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-border bg-card-gradient shadow-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-background/40 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <GitCommit className="h-4 w-4 text-primary" />
          <h3 className="font-mono text-xs uppercase tracking-wider text-foreground">
            Deployment History
          </h3>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          last {history.length} runs
        </span>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="font-mono text-[10px] uppercase tracking-wider w-[100px]">Commit</TableHead>
            <TableHead className="font-mono text-[10px] uppercase tracking-wider">Message</TableHead>
            <TableHead className="font-mono text-[10px] uppercase tracking-wider w-[80px]">Author</TableHead>
            <TableHead className="font-mono text-[10px] uppercase tracking-wider w-[80px]">Duration</TableHead>
            <TableHead className="font-mono text-[10px] uppercase tracking-wider w-[90px]">Status</TableHead>
            <TableHead className="font-mono text-[10px] uppercase tracking-wider w-[80px]">When</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((d) => (
            <motion.tr
              key={d.id}
              initial={false}
              className="border-border group cursor-pointer hover:bg-primary/5 transition-colors"
              onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
            >
              <TableCell className="font-mono text-xs text-primary">{d.commit}</TableCell>
              <TableCell className="text-xs text-foreground/90 max-w-[200px] truncate">{d.message}</TableCell>
              <TableCell className="font-mono text-[11px] text-muted-foreground">{d.author}</TableCell>
              <TableCell className="font-mono text-[11px] text-muted-foreground">{d.duration}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase ${statusBadge[d.status]}`}>
                  {statusIcon[d.status]}
                  {d.status}
                </span>
              </TableCell>
              <TableCell className="font-mono text-[11px] text-muted-foreground">{d.when}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReplayLogs(d.logs);
                    }}
                    title="Replay logs"
                  >
                    <Play className="h-3 w-3 text-primary" />
                  </Button>
                  {expandedId === d.id ? (
                    <ChevronUp className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>

      <AnimatePresence>
        {expandedId && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border bg-background/30"
          >
            <div className="p-4 font-mono text-[12px] leading-relaxed max-h-[200px] overflow-y-auto scanlines">
              {history.find((h) => h.id === expandedId)?.logs.map((l, i) => (
                <div key={i} className="flex gap-3 py-0.5">
                  <span className="shrink-0 text-muted-foreground">{l.ts}</span>
                  <span className={`shrink-0 w-12 uppercase ${
                    l.level === "ok" ? "text-primary" : l.level === "warn" ? "text-warning" : l.level === "error" ? "text-destructive" : "text-accent"
                  }`}>{l.level}</span>
                  <span className="shrink-0 w-28 text-muted-foreground truncate">[{l.source}]</span>
                  <span className="text-foreground/90">{l.msg}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
