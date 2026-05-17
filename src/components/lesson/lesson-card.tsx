import Link from "next/link";
import { Clock, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TEXT_SEP } from "@/lib/format";
import { levelToJapanese } from "@/lib/level-mapping";

export interface LessonCardData {
  id: string;
  title: string;
  level?: string;
  description?: string;
  durationMinutes?: number;
  progress?: {
    status: string;
    progressPercent: number;
  } | null;
  reasons?: Array<{ label: string; detail: string }>;
  score?: number;
}

export function LessonCard({ lesson, href }: { lesson: LessonCardData; href?: string }) {
  const link = href ?? `/lessons/${lesson.id}`;
  const percent = lesson.progress?.progressPercent ?? 0;

  return (
    <Link href={link} prefetch>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{lesson.title}</CardTitle>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          </div>
          <div className="flex flex-wrap gap-2">
            {lesson.level && (
              <Badge variant="secondary">{levelToJapanese(lesson.level)}</Badge>
            )}
            {lesson.durationMinutes && (
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {lesson.durationMinutes} 分钟
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {lesson.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{lesson.description}</p>
          )}
          {lesson.reasons && lesson.reasons.length > 0 && (
            <p className="text-xs text-primary">
              {lesson.reasons[0].label} {TEXT_SEP} {lesson.reasons[0].detail}
            </p>
          )}
          {lesson.progress && lesson.progress.status !== "NOT_STARTED" && (
            <Progress value={percent} />
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
