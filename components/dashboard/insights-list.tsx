import type { Insight } from "@/lib/queries/insights";
import { Card, CardContent } from "@/components/ui/card";

export function InsightsList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {insights.map((insight, i) => (
        <Card key={i}>
          <CardContent className="p-4 flex items-start gap-3">
            <span className="text-xl leading-none">{insight.emoji}</span>
            <div>
              <p className="text-sm font-medium text-foreground">{insight.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{insight.message}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
