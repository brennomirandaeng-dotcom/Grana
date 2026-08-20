"use client";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { useToasts, dismissToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function Toaster() {
  const toasts = useToasts();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-3 rounded-xl border border-border bg-surface p-4 shadow-lg animate-in slide-in-from-bottom-2 fade-in",
            t.variant === "success" && "border-positive/30",
            t.variant === "destructive" && "border-negative/30"
          )}
        >
          {t.variant === "success" && <CheckCircle2 className="h-5 w-5 text-positive shrink-0 mt-0.5" />}
          {t.variant === "destructive" && <AlertTriangle className="h-5 w-5 text-negative shrink-0 mt-0.5" />}
          {(!t.variant || t.variant === "default") && <Info className="h-5 w-5 text-info shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{t.title}</p>
            {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
          </div>
          <button onClick={() => dismissToast(t.id)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
