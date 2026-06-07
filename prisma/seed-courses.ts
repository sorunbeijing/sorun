/**
 * 批量生成并导入课程数据到 Supabase（可重复执行）
 *
 * 用法:
 *   pnpm db:seed-courses
 *
 * 说明:
 *   - 不修改用户、管理员账号
 *   - 使用 slug / templateId+themeTagId 做 upsert，避免重复插入
 *   - 现有 5 个种子课程模板保留，本脚本新增 14领域×5等级=70 套课程
 */
import { Prisma, PrismaClient } from "@prisma/client";
import { ALL_DOMAINS, EXPECTED_LESSON_COUNT, getAllGeneratedLessons } from "./course-data/catalog";

const prisma = new PrismaClient();

type ImportStats = {
  interestTags: { created: number; updated: number };
  lessonTemplates: { created: number; updated: number };
  themeVariants: { created: number; updated: number };
  totalVocab: number;
  totalQuestions: number;
  skippedSlugs: string[];
};

async function seedInterestTags(stats: ImportStats) {
  for (const domain of ALL_DOMAINS) {
    const existing = await prisma.interestTag.findUnique({ where: { slug: domain.slug } });
    await prisma.interestTag.upsert({
      where: { slug: domain.slug },
      update: {
        nameZh: domain.nameZh,
        nameJa: domain.nameJa,
        category: domain.category,
        icon: domain.icon,
        sortOrder: domain.sortOrder,
        isActive: true,
      },
      create: {
        slug: domain.slug,
        nameZh: domain.nameZh,
        nameJa: domain.nameJa,
        category: domain.category,
        icon: domain.icon,
        sortOrder: domain.sortOrder,
        isActive: true,
      },
    });
    if (existing) stats.interestTags.updated += 1;
    else stats.interestTags.created += 1;
  }
}

async function seedLessons(stats: ImportStats) {
  const tagsBySlug = Object.fromEntries(
    (await prisma.interestTag.findMany()).map((t) => [t.slug, t])
  );

  const lessons = getAllGeneratedLessons();

  for (const lesson of lessons) {
    const tag = tagsBySlug[lesson.domainSlug];
    if (!tag) {
      stats.skippedSlugs.push(lesson.slug);
      continue;
    }

    const existingTemplate = await prisma.lessonTemplate.findUnique({
      where: { slug: lesson.slug },
    });

    const template = await prisma.lessonTemplate.upsert({
      where: { slug: lesson.slug },
      update: {
        title: lesson.title,
        description: lesson.description,
        baseLevel: lesson.baseLevel,
        durationMinutes: lesson.durationMinutes,
        difficulty: lesson.difficulty,
        contentJson: lesson.contentJson as Prisma.InputJsonValue,
        quizJson: lesson.quizJson as Prisma.InputJsonValue,
        isActive: true,
      },
      create: {
        slug: lesson.slug,
        title: lesson.title,
        description: lesson.description,
        baseLevel: lesson.baseLevel,
        durationMinutes: lesson.durationMinutes,
        difficulty: lesson.difficulty,
        contentJson: lesson.contentJson as Prisma.InputJsonValue,
        quizJson: lesson.quizJson as Prisma.InputJsonValue,
        isActive: true,
      },
    });

    if (existingTemplate) stats.lessonTemplates.updated += 1;
    else stats.lessonTemplates.created += 1;

    stats.totalVocab += lesson.vocabCount;
    stats.totalQuestions += lesson.questionCount;

    const existingVariant = await prisma.lessonThemeVariant.findUnique({
      where: {
        templateId_themeTagId: {
          templateId: template.id,
          themeTagId: tag.id,
        },
      },
    });

    await prisma.lessonThemeVariant.upsert({
      where: {
        templateId_themeTagId: {
          templateId: template.id,
          themeTagId: tag.id,
        },
      },
      update: {
        titleOverride: `${tag.nameZh} · ${lesson.title}`,
        contentPatchJson: { themeSlug: tag.slug, theme: tag.nameZh },
      },
      create: {
        templateId: template.id,
        themeTagId: tag.id,
        titleOverride: `${tag.nameZh} · ${lesson.title}`,
        contentPatchJson: { themeSlug: tag.slug, theme: tag.nameZh },
      },
    });

    if (existingVariant) stats.themeVariants.updated += 1;
    else stats.themeVariants.created += 1;
  }
}

async function main() {
  const stats: ImportStats = {
    interestTags: { created: 0, updated: 0 },
    lessonTemplates: { created: 0, updated: 0 },
    themeVariants: { created: 0, updated: 0 },
    totalVocab: 0,
    totalQuestions: 0,
    skippedSlugs: [],
  };

  console.log("=== 课程数据导入开始 ===");
  console.log(`预期生成课程模板: ${EXPECTED_LESSON_COUNT}（14 领域 × 5 等级，内容量 ×5，时长 ≈ 原始 ×2.5）`);
  console.log("");

  console.log("[1/2] 导入兴趣标签...");
  await seedInterestTags(stats);

  console.log("[2/2] 导入课程模板与主题版本...");
  await seedLessons(stats);

  const totalTemplates = await prisma.lessonTemplate.count();
  const totalVariants = await prisma.lessonThemeVariant.count();
  const activeTemplates = await prisma.lessonTemplate.count({ where: { isActive: true } });

  console.log("");
  console.log("=== 导入统计 ===");
  console.log(`兴趣标签  新建: ${stats.interestTags.created}  更新: ${stats.interestTags.updated}`);
  console.log(
    `课程模板  新建: ${stats.lessonTemplates.created}  更新: ${stats.lessonTemplates.updated}`
  );
  console.log(
    `主题版本  新建: ${stats.themeVariants.created}  更新: ${stats.themeVariants.updated}`
  );
  console.log(`词汇条目  合计: ${stats.totalVocab}（跨课程累计）`);
  console.log(`练习题    合计: ${stats.totalQuestions}（跨课程累计）`);
  console.log("");
  console.log("=== 数据库现状 ===");
  console.log(`lesson_templates 总数: ${totalTemplates}（启用: ${activeTemplates}）`);
  console.log(`lesson_theme_variants 总数: ${totalVariants}`);

  if (stats.skippedSlugs.length > 0) {
    console.warn("以下 slug 因缺少兴趣标签被跳过:", stats.skippedSlugs.join(", "));
  }

  console.log("");
  console.log("导入完成。用户下次登录或访问推荐页时将自动生成新的 generated_lessons。");
  console.log("如需同步已有用户课程内容为最新模板，可执行: pnpm db:sync-lessons-ja");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
