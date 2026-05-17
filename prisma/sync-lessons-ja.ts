/**
 * 将 generated_lessons 的 contentJson / quizJson 从模板重新同步（恢复日文词汇/测验）
 * 用法: pnpm db:sync-lessons-ja
 */
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function syncAllGeneratedLessonsFromTemplates() {
  const lessons = await prisma.generatedLesson.findMany({
    include: {
      template: true,
      themeVariant: { include: { themeTag: true } },
      user: { select: { email: true } },
    },
  });

  let count = 0;
  for (const lesson of lessons) {
    const contentJson = lesson.template.contentJson as Prisma.JsonObject;
    const patchedContent = lesson.themeVariant?.themeTag
      ? { ...contentJson, theme: lesson.themeVariant.themeTag.nameZh }
      : contentJson;

    await prisma.generatedLesson.update({
      where: { id: lesson.id },
      data: {
        contentJson: patchedContent as Prisma.InputJsonValue,
        quizJson: lesson.template.quizJson as Prisma.InputJsonValue,
      },
    });
    count += 1;
    console.log(`  synced: ${lesson.user?.email ?? "—"} / ${lesson.title}`);
  }

  return count;
}

async function main() {
  console.log("Syncing generated lessons from templates (Japanese content)...");
  const n = await syncAllGeneratedLessonsFromTemplates();
  console.log(`Done. Updated ${n} lesson(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
