import { LessonForm } from "@/components/admin/lesson-form";

export default function AdminNewLessonPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">新增课程模板</h1>
      <LessonForm />
    </div>
  );
}
