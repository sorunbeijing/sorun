import { Prisma, PrismaClient, ProficiencyLevel, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addYears, defaultExpiresAt } from "../src/lib/user-expiry";
import { expandLegacyLessonContent } from "./course-data/lesson-expander";

const prisma = new PrismaClient();

const interestTags = [
  { slug: "anime", nameZh: "动漫", nameJa: "アニメ", category: "entertainment", icon: "🎌", sortOrder: 1 },
  { slug: "food", nameZh: "美食", nameJa: "グルメ", category: "lifestyle", icon: "🍜", sortOrder: 2 },
  { slug: "travel", nameZh: "旅行", nameJa: "旅行", category: "lifestyle", icon: "✈️", sortOrder: 3 },
  { slug: "business", nameZh: "商务", nameJa: "ビジネス", category: "career", icon: "💼", sortOrder: 4 },
  { slug: "music", nameZh: "音乐", nameJa: "音楽", category: "entertainment", icon: "🎵", sortOrder: 5 },
  { slug: "sports", nameZh: "运动", nameJa: "スポーツ", category: "lifestyle", icon: "⚽", sortOrder: 6 },
  { slug: "tech", nameZh: "科技", nameJa: "テクノロジー", category: "career", icon: "💻", sortOrder: 7 },
  { slug: "history", nameZh: "历史", nameJa: "歴史", category: "culture", icon: "📜", sortOrder: 8 },
  { slug: "gaming", nameZh: "游戏", nameJa: "ゲーム", category: "entertainment", icon: "🎮", sortOrder: 9 },
  { slug: "movies", nameZh: "电影", nameJa: "映画", category: "entertainment", icon: "🎬", sortOrder: 10 },
  { slug: "shopping", nameZh: "购物", nameJa: "ショッピング", category: "lifestyle", icon: "🛍️", sortOrder: 11 },
  { slug: "workplace", nameZh: "职场", nameJa: "職場", category: "career", icon: "🏢", sortOrder: 12 },
  { slug: "daily-life", nameZh: "生活日常", nameJa: "日常生活", category: "lifestyle", icon: "🏠", sortOrder: 13 },
  { slug: "social", nameZh: "交友社交", nameJa: "友人作り・社交", category: "lifestyle", icon: "🤝", sortOrder: 14 },
];

const lessonTemplates = [
  {
    slug: "greeting-basics",
    title: "问候基础",
    description: "学习日常问候与自我介绍",
    baseLevel: ProficiencyLevel.BEGINNER,
    durationMinutes: 10,
    difficulty: 1,
    vocab: [
      { hanzi: "你好", pinyin: "nǐ hǎo", meaning: "こんにちは / 挨拶のときに使う" },
      { hanzi: "谢谢", pinyin: "xiè xie", meaning: "ありがとう" },
      { hanzi: "再见", pinyin: "zài jiàn", meaning: "さようなら" },
    ],
    quiz: [
      {
        id: "q1",
        question: "「你好」的意思是？",
        options: ["こんにちは", "ありがとう", "さようなら"],
        answer: 0,
      },
      {
        id: "q2",
        question: "「谢谢」的意思是？",
        options: ["こんにちは", "ありがとう", "ごめんなさい"],
        answer: 1,
      },
    ],
  },
  {
    slug: "anime-expressions",
    title: "动漫常用表达",
    description: "动漫场景中常见口语",
    baseLevel: ProficiencyLevel.ELEMENTARY,
    durationMinutes: 15,
    difficulty: 2,
    vocab: [
      { hanzi: "厉害", pinyin: "lì hai", meaning: "すごい / 感心したとき" },
      { hanzi: "加油", pinyin: "jiā yóu", meaning: "頑張って / 応援するとき" },
      { hanzi: "可爱", pinyin: "kě ài", meaning: "かわいい" },
    ],
    quiz: [
      { id: "q1", question: "「加油」常用于？", options: ["鼓励", "告别", "道歉"], answer: 0 },
      {
        id: "q2",
        question: "「可爱」的意思是？",
        options: ["かわいい", "怒っている", "疲れた"],
        answer: 0,
      },
    ],
  },
  {
    slug: "food-ordering",
    title: "餐厅点餐",
    description: "在餐厅点餐的实用句型",
    baseLevel: ProficiencyLevel.ELEMENTARY,
    durationMinutes: 15,
    difficulty: 2,
    vocab: [
      { hanzi: "菜单", pinyin: "cài dān", meaning: "メニュー" },
      { hanzi: "买单", pinyin: "mǎi dān", meaning: "お会計（勘定）" },
      { hanzi: "好吃", pinyin: "hǎo chī", meaning: "おいしい" },
    ],
    quiz: [
      {
        id: "q1",
        question: "「菜单」的意思是？",
        options: ["メニュー", "テーブル", "ウェイター"],
        answer: 0,
      },
      { id: "q2", question: "想说很好吃，用？", options: ["好吃", "好看", "好听"], answer: 0 },
    ],
  },
  {
    slug: "travel-directions",
    title: "问路出行",
    description: "旅行中问路与交通表达",
    baseLevel: ProficiencyLevel.INTERMEDIATE,
    durationMinutes: 20,
    difficulty: 3,
    vocab: [
      { hanzi: "地铁", pinyin: "dì tiě", meaning: "地下鉄" },
      { hanzi: "火车站", pinyin: "huǒ chē zhàn", meaning: "駅 / 火車の駅" },
      { hanzi: "怎么走", pinyin: "zěn me zǒu", meaning: "どう行けばいいですか / 道を尋ねる" },
    ],
    quiz: [
      {
        id: "q1",
        question: "「地铁」的意思是？",
        options: ["地下鉄", "バス", "タクシー"],
        answer: 0,
      },
      { id: "q2", question: "问路可以说？", options: ["怎么走", "多少钱", "很好吃"], answer: 0 },
    ],
  },
  {
    slug: "business-meeting",
    title: "商务会议用语",
    description: "职场会议中的礼貌表达",
    baseLevel: ProficiencyLevel.UPPER_INTERMEDIATE,
    durationMinutes: 25,
    difficulty: 4,
    vocab: [
      { hanzi: "合作", pinyin: "hé zuò", meaning: "協力・コラボ" },
      { hanzi: "提案", pinyin: "tí àn", meaning: "提案（ていあん）" },
      { hanzi: "安排", pinyin: "ān pái", meaning: "手配する / スケジュールを組む" },
    ],
    quiz: [
      {
        id: "q1",
        question: "「合作」的意思是？",
        options: ["協力", "競争", "休暇"],
        answer: 0,
      },
      {
        id: "q2",
        question: "「提案」的意思是？",
        options: ["提案", "問題", "製品"],
        answer: 0,
      },
    ],
  },
];

const themeMapping: Record<string, string[]> = {
  "greeting-basics": ["travel", "business"],
  "anime-expressions": ["anime", "music"],
  "food-ordering": ["food"],
  "travel-directions": ["travel"],
  "business-meeting": ["business", "tech"],
};

/** 将 interest_tags.name_en 重命名为 name_ja（已有库升级） */
async function migrateInterestTagColumn() {
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'interest_tags'
          AND column_name = 'name_en'
      ) THEN
        ALTER TABLE interest_tags RENAME COLUMN name_en TO name_ja;
      END IF;
    END $$;
  `);
}

/** 从模板同步用户已生成课程的 contentJson / quizJson（日文内容） */
async function syncGeneratedLessonsFromTemplates(userId: string) {
  const lessons = await prisma.generatedLesson.findMany({
    where: { userId },
    include: {
      template: true,
      themeVariant: { include: { themeTag: true } },
    },
  });

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
  }

  return lessons.length;
}

async function main() {
  console.log("Migrating interest_tags column (name_en -> name_ja)...");
  await migrateInterestTagColumn();

  console.log("Seeding interest tags...");
  for (const tag of interestTags) {
    await prisma.interestTag.upsert({
      where: { slug: tag.slug },
      update: tag,
      create: tag,
    });
  }

  const tagsBySlug = Object.fromEntries(
    (await prisma.interestTag.findMany()).map((t) => [t.slug, t])
  );

  console.log("Seeding lesson templates...");
  for (const tpl of lessonTemplates) {
    const v0 = tpl.vocab[0];
    const v1 = tpl.vocab[1] ?? tpl.vocab[0];
    const expanded = expandLegacyLessonContent({
      theme: tpl.title,
      title: tpl.title,
      objectives: [tpl.description],
      vocab: tpl.vocab,
      dialogue: [
        { speaker: "A", text: v0.hanzi, pinyin: v0.pinyin, meaning: v0.meaning },
        { speaker: "B", text: v1.hanzi, pinyin: v1.pinyin, meaning: v1.meaning },
      ],
      quiz: tpl.quiz,
      slug: tpl.slug,
      level: tpl.baseLevel,
      originalDurationMinutes: tpl.durationMinutes,
    });

    const template = await prisma.lessonTemplate.upsert({
      where: { slug: tpl.slug },
      update: {
        title: tpl.title,
        description: tpl.description,
        baseLevel: tpl.baseLevel,
        durationMinutes: expanded.durationMinutes,
        difficulty: tpl.difficulty,
        contentJson: expanded.contentJson as Prisma.InputJsonValue,
        quizJson: expanded.quizJson as Prisma.InputJsonValue,
      },
      create: {
        slug: tpl.slug,
        title: tpl.title,
        description: tpl.description,
        baseLevel: tpl.baseLevel,
        durationMinutes: expanded.durationMinutes,
        difficulty: tpl.difficulty,
        contentJson: expanded.contentJson as Prisma.InputJsonValue,
        quizJson: expanded.quizJson as Prisma.InputJsonValue,
      },
    });

    const slugs = themeMapping[tpl.slug] ?? [];
    for (const slug of slugs) {
      const tag = tagsBySlug[slug];
      if (!tag) continue;
      await prisma.lessonThemeVariant.upsert({
        where: {
          templateId_themeTagId: {
            templateId: template.id,
            themeTagId: tag.id,
          },
        },
        update: {
          titleOverride: `${tag.nameZh} · ${tpl.title}`,
        },
        create: {
          templateId: template.id,
          themeTagId: tag.id,
          titleOverride: `${tag.nameZh} · ${tpl.title}`,
          contentPatchJson: { themeSlug: slug },
        },
      });
    }
  }

  console.log("Seeding demo users...");
  const passwordHash = await bcrypt.hash("demo123456", 10);

  const demoExpires = defaultExpiresAt();

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: { passwordHash, name: "演示用户", expiresAt: demoExpires },
    create: {
      email: "demo@example.com",
      passwordHash,
      name: "演示用户",
      role: UserRole.USER,
      expiresAt: demoExpires,
      profile: {
        create: {
          displayName: "演示用户",
          level: ProficiencyLevel.ELEMENTARY,
        },
      },
    },
    include: { profile: true },
  });

  if (!demoUser.profile) {
    await prisma.userProfile.create({
      data: {
        userId: demoUser.id,
        displayName: "演示用户",
        level: ProficiencyLevel.ELEMENTARY,
      },
    });
  }

  const animeTag = tagsBySlug["anime"];
  const foodTag = tagsBySlug["food"];
  if (animeTag) {
    await prisma.userInterest.upsert({
      where: { userId_tagId: { userId: demoUser.id, tagId: animeTag.id } },
      update: { isPrimary: true, weight: 10 },
      create: { userId: demoUser.id, tagId: animeTag.id, isPrimary: true, weight: 10 },
    });
    await prisma.userProfile.update({
      where: { userId: demoUser.id },
      data: { primaryInterestId: animeTag.id },
    });
  }
  if (foodTag) {
    await prisma.userInterest.upsert({
      where: { userId_tagId: { userId: demoUser.id, tagId: foodTag.id } },
      update: { isPrimary: false, weight: 5 },
      create: { userId: demoUser.id, tagId: foodTag.id, isPrimary: false, weight: 5 },
    });
  }

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { passwordHash, name: "管理员", expiresAt: null },
    create: {
      email: "admin@example.com",
      passwordHash,
      name: "管理员",
      role: UserRole.ADMIN,
      expiresAt: null,
      profile: {
        create: {
          displayName: "管理员",
          level: ProficiencyLevel.ADVANCED,
        },
      },
    },
  });

  const usersWithoutExpiry = await prisma.user.findMany({
    where: { expiresAt: null, role: UserRole.USER },
  });
  for (const u of usersWithoutExpiry) {
    await prisma.user.update({
      where: { id: u.id },
      data: { expiresAt: addYears(u.createdAt, 1) },
    });
  }

  const synced = await syncGeneratedLessonsFromTemplates(demoUser.id);
  console.log(`Synced ${synced} generated lesson(s) for demo user (Japanese content).`);

  console.log("Seed completed.");
  console.log("Demo account: demo@example.com / demo123456");
  console.log("Admin account: admin@example.com / demo123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
