import { ProficiencyLevel } from "@prisma/client";
import { ALL_LEVELS } from "./types";
import { targetCount } from "./duration";
import {
  buildExpandedQuizWithDistractors,
} from "./quiz-distractors";
import type {
  DialogueLine,
  DomainSpec,
  LevelLessonSpec,
  VocabItem,
} from "./types";

export const EXPANSION_FACTOR = 5;

type ExampleItem = VocabItem;

function dedupeByHanzi(items: VocabItem[]): VocabItem[] {
  const seen = new Set<string>();
  const out: VocabItem[] = [];
  for (const item of items) {
    if (seen.has(item.hanzi)) continue;
    seen.add(item.hanzi);
    out.push(item);
  }
  return out;
}

/** 从同领域其他等级 + 补充词库收集扩展词汇 */
function collectDomainPool(domain: DomainSpec, level: ProficiencyLevel): VocabItem[] {
  const pool: VocabItem[] = [];
  for (const lv of ALL_LEVELS) {
    const lesson = domain.lessons[lv];
    if (lesson) pool.push(...lesson.vocab);
  }
  pool.push(...getSupplementVocab(domain.slug, level));
  return dedupeByHanzi(pool);
}

/** 各领域/等级补充词汇（程序化扩展，避免重复 base） */
function getSupplementVocab(domainSlug: string, level: ProficiencyLevel): VocabItem[] {
  const supplements: Record<string, Partial<Record<ProficiencyLevel, VocabItem[]>>> = {
    anime: {
      [ProficiencyLevel.BEGINNER]: [
        { hanzi: "动画", pinyin: "dòng huà", meaning: "アニメーション" },
        { hanzi: "喜欢", pinyin: "xǐ huan", meaning: "好き" },
        { hanzi: "看", pinyin: "kàn", meaning: "見る" },
        { hanzi: "朋友", pinyin: "péng you", meaning: "友達" },
        { hanzi: "推荐", pinyin: "tuī jiàn", meaning: "おすすめ" },
        { hanzi: "故事", pinyin: "gù shi", meaning: "ストーリー" },
        { hanzi: "画面", pinyin: "huà miàn", meaning: "画面" },
        { hanzi: "声音", pinyin: "shēng yīn", meaning: "声" },
      ],
      [ProficiencyLevel.ELEMENTARY]: [
        { hanzi: "一集", pinyin: "yī jí", meaning: "一話" },
        { hanzi: "期待", pinyin: "qī dài", meaning: "期待" },
        { hanzi: "回忆", pinyin: "huí yì", meaning: "思い出" },
        { hanzi: "场景", pinyin: "chǎng jǐng", meaning: "シーン" },
        { hanzi: "台词", pinyin: "tái cí", meaning: "セリフ" },
        { hanzi: "模仿", pinyin: "mó fǎng", meaning: "真似する" },
        { hanzi: "发音", pinyin: "fā yīn", meaning: "発音" },
        { hanzi: "练习", pinyin: "liàn xí", meaning: "練習" },
      ],
    },
    food: {
      [ProficiencyLevel.BEGINNER]: [
        { hanzi: "餐厅", pinyin: "cān tīng", meaning: "レストラン" },
        { hanzi: "服务员", pinyin: "fú wù yuán", meaning: "店員" },
        { hanzi: "请", pinyin: "qǐng", meaning: "どうぞ" },
        { hanzi: "茶", pinyin: "chá", meaning: "お茶" },
        { hanzi: "面条", pinyin: "miàn tiáo", meaning: "麺" },
        { hanzi: "饺子", pinyin: "jiǎo zi", meaning: "餃子" },
      ],
    },
    travel: {
      [ProficiencyLevel.BEGINNER]: [
        { hanzi: "地图", pinyin: "dì tú", meaning: "地図" },
        { hanzi: "车站", pinyin: "chē zhàn", meaning: "駅" },
        { hanzi: "附近", pinyin: "fù jìn", meaning: "近く" },
        { hanzi: "远", pinyin: "yuǎn", meaning: "遠い" },
        { hanzi: "近", pinyin: "jìn", meaning: "近い" },
        { hanzi: "票", pinyin: "piào", meaning: "切符" },
      ],
    },
  };

  const genericByLevel: Record<ProficiencyLevel, VocabItem[]> = {
    [ProficiencyLevel.BEGINNER]: [
      { hanzi: "什么", pinyin: "shén me", meaning: "何" },
      { hanzi: "怎么", pinyin: "zěn me", meaning: "どう" },
      { hanzi: "很", pinyin: "hěn", meaning: "とても" },
      { hanzi: "也", pinyin: "yě", meaning: "も" },
      { hanzi: "吗", pinyin: "ma", meaning: "〜ですか（疑問）" },
      { hanzi: "不", pinyin: "bù", meaning: "〜ない" },
    ],
    [ProficiencyLevel.ELEMENTARY]: [
      { hanzi: "因为", pinyin: "yīn wèi", meaning: "なぜなら" },
      { hanzi: "所以", pinyin: "suǒ yǐ", meaning: "だから" },
      { hanzi: "可能", pinyin: "kě néng", meaning: "かもしれない" },
      { hanzi: "应该", pinyin: "yīng gāi", meaning: "〜すべき" },
      { hanzi: "已经", pinyin: "yǐ jīng", meaning: "もう" },
      { hanzi: "一起", pinyin: "yī qǐ", meaning: "一緒に" },
    ],
    [ProficiencyLevel.INTERMEDIATE]: [
      { hanzi: "虽然", pinyin: "suī rán", meaning: "〜だけど" },
      { hanzi: "但是", pinyin: "dàn shì", meaning: "しかし" },
      { hanzi: "不过", pinyin: "bú guò", meaning: "ただし" },
      { hanzi: "其实", pinyin: "qí shí", meaning: "実は" },
      { hanzi: "特别", pinyin: "tè bié", meaning: "特に" },
      { hanzi: "比较", pinyin: "bǐ jiào", meaning: "比較的" },
    ],
    [ProficiencyLevel.UPPER_INTERMEDIATE]: [
      { hanzi: "显然", pinyin: "xiǎn rán", meaning: "明らかに" },
      { hanzi: "进一步", pinyin: "jìn yī bù", meaning: "さらに" },
      { hanzi: "整体", pinyin: "zhěng tǐ", meaning: "全体として" },
      { hanzi: "细节", pinyin: "xì jié", meaning: "細部" },
      { hanzi: "趋势", pinyin: "qū shì", meaning: "傾向" },
    ],
    [ProficiencyLevel.ADVANCED]: [
      { hanzi: "本质", pinyin: "běn zhì", meaning: "本質" },
      { hanzi: "层面", pinyin: "céng miàn", meaning: "レベル・層" },
      { hanzi: "视角", pinyin: "shì jiǎo", meaning: "視点" },
      { hanzi: "维度", pinyin: "wéi dù", meaning: "次元" },
      { hanzi: "内核", pinyin: "nèi hé", meaning: "核心" },
      { hanzi: "张力", pinyin: "zhāng lì", meaning: "テンション" },
    ],
  };

  const domainPool = supplements[domainSlug]?.[level] ?? [];
  const generic = genericByLevel[level] ?? [];
  return dedupeByHanzi([...domainPool, ...generic]);
}

function expandVocab(
  base: VocabItem[],
  domain: DomainSpec,
  level: ProficiencyLevel
): VocabItem[] {
  const target = targetCount(base.length);
  const pool = collectDomainPool(domain, level);
  const baseSet = new Set(base.map((x) => x.hanzi));
  const merged = dedupeByHanzi([
    ...base,
    ...pool.filter((x) => !baseSet.has(x.hanzi)),
  ]);

  if (merged.length >= target) return merged.slice(0, target);

  // 组合新词（同主题短语），确保不重复
  const extra: VocabItem[] = [];
  let idx = 0;
  while (merged.length + extra.length < target && idx < base.length * 8) {
    const word = base[idx % base.length];
    const variant = idx % 4;
    const candidates: VocabItem[] = [
      {
        hanzi: `很${word.hanzi}`,
        pinyin: `hěn ${word.pinyin}`,
        meaning: `とても${word.meaning}`,
      },
      {
        hanzi: `${word.hanzi}很好`,
        pinyin: `${word.pinyin} hěn hǎo`,
        meaning: `${word.meaning}はとても良い`,
      },
      {
        hanzi: `学习${word.hanzi}`,
        pinyin: `xué xí ${word.pinyin}`,
        meaning: `${word.meaning}を学ぶ`,
      },
      {
        hanzi: `关于${word.hanzi}`,
        pinyin: `guān yú ${word.pinyin}`,
        meaning: `${word.meaning}について`,
      },
    ];
    const pick = candidates[variant];
    if (!merged.some((x) => x.hanzi === pick.hanzi) && !extra.some((x) => x.hanzi === pick.hanzi)) {
      extra.push(pick);
    }
    idx += 1;
  }

  return dedupeByHanzi([...merged, ...extra]).slice(0, target);
}

function expandExamples(
  baseDialogue: DialogueLine[],
  vocab: VocabItem[],
  baseCount: number
): ExampleItem[] {
  const target = targetCount(Math.max(2, baseCount));
  const fromDialogue: ExampleItem[] = baseDialogue.map((d) => ({
    hanzi: d.text,
    pinyin: d.pinyin,
    meaning: d.meaning,
  }));

  const patterns = (word: VocabItem, i: number): ExampleItem[] => {
    const templates: ExampleItem[] = [
      {
        hanzi: `这是${word.hanzi}。`,
        pinyin: `zhè shì ${word.pinyin}。`,
        meaning: `これは${word.meaning}です。`,
      },
      {
        hanzi: `我喜欢${word.hanzi}。`,
        pinyin: `wǒ xǐ huan ${word.pinyin}。`,
        meaning: `${word.meaning}が好きです。`,
      },
      {
        hanzi: `${word.hanzi}很重要。`,
        pinyin: `${word.pinyin} hěn zhòng yào。`,
        meaning: `${word.meaning}はとても大切です。`,
      },
      {
        hanzi: `请用${word.hanzi}造句。`,
        pinyin: `qǐng yòng ${word.pinyin} zào jù。`,
        meaning: `${word.meaning}を使って文を作ってください。`,
      },
      {
        hanzi: `今天学习${word.hanzi}。`,
        pinyin: `jīn tiān xué xí ${word.pinyin}。`,
        meaning: `今日は${word.meaning}を勉強します。`,
      },
    ];
    return [templates[i % templates.length]];
  };

  const generated = vocab.flatMap((word, i) => patterns(word, i));
  return dedupeByHanzi([...fromDialogue, ...generated]).slice(0, target);
}

function expandDialogue(
  base: DialogueLine[],
  vocab: VocabItem[],
  examples: ExampleItem[]
): DialogueLine[] {
  const target = targetCount(base.length);
  const lines: DialogueLine[] = [...base];

  const qaPatterns: Array<(a: VocabItem, b: VocabItem) => DialogueLine[]> = [
    (a, b) => [
      {
        speaker: "A",
        text: `你知道${a.hanzi}吗？`,
        pinyin: `nǐ zhī dào ${a.pinyin} ma?`,
        meaning: `${a.meaning}を知っていますか？`,
      },
      {
        speaker: "B",
        text: `知道，${b.hanzi}也很有意思。`,
        pinyin: `zhī dào, ${b.pinyin} yě hěn yǒu yì si`,
        meaning: `知ってる、${b.meaning}も面白いよ。`,
      },
    ],
    (a, b) => [
      {
        speaker: "A",
        text: `请跟我说${a.hanzi}。`,
        pinyin: `qǐng gēn wǒ shuō ${a.pinyin}`,
        meaning: `${a.meaning}を言ってみて。`,
      },
      {
        speaker: "B",
        text: `好的，${b.hanzi}。`,
        pinyin: `hǎo de, ${b.pinyin}`,
        meaning: `いいよ、${b.meaning}。`,
      },
    ],
    (a, b) => [
      {
        speaker: "A",
        text: `${a.hanzi}怎么说？`,
        pinyin: `${a.pinyin} zěn me shuō?`,
        meaning: `${a.meaning}は中国語で何という？`,
      },
      {
        speaker: "B",
        text: `可以说${b.hanzi}。`,
        pinyin: `kě yǐ shuō ${b.pinyin}`,
        meaning: `${b.meaning}と言えるよ。`,
      },
    ],
  ];

  let vi = 0;
  while (lines.length < target && vi < vocab.length * 3) {
    const a = vocab[vi % vocab.length];
    const b = vocab[(vi + 1) % vocab.length];
    lines.push(...qaPatterns[vi % qaPatterns.length](a, b));
    vi += 1;
  }

  // 从例句补充对话轮次
  for (const ex of examples) {
    if (lines.length >= target) break;
    lines.push({
      speaker: lines.length % 2 === 0 ? "A" : "B",
      text: ex.hanzi,
      pinyin: ex.pinyin,
      meaning: ex.meaning,
    });
  }

  return dedupeDialogue(lines).slice(0, target);
}

function dedupeDialogue(lines: DialogueLine[]): DialogueLine[] {
  const seen = new Set<string>();
  return lines.filter((l) => {
    const key = `${l.text}|${l.speaker}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function expandReviewItems(
  vocab: VocabItem[],
  examples: ExampleItem[],
  baseVocabCount: number
): VocabItem[] {
  const target = targetCount(baseVocabCount);
  const pool = dedupeByHanzi([
    ...vocab.map((w) => ({
      hanzi: w.hanzi,
      pinyin: w.pinyin,
      meaning: `【復習】${w.meaning}`,
    })),
    ...examples.map((e) => ({
      hanzi: e.hanzi,
      pinyin: e.pinyin,
      meaning: `【例文復習】${e.meaning}`,
    })),
  ]);
  return pool.slice(0, target);
}

export function buildExpandedQuiz(
  vocab: VocabItem[],
  examples: ExampleItem[],
  slug: string,
  baseQuestionCount: number,
  domainSlug: string
) {
  return buildExpandedQuizWithDistractors(
    vocab,
    examples,
    slug,
    baseQuestionCount,
    domainSlug
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export type ExpandedLessonContent = {
  contentJson: Record<string, unknown>;
  quizJson: Record<string, unknown>;
  vocabCount: number;
  exampleCount: number;
  dialogueCount: number;
  reviewCount: number;
  questionCount: number;
  stepCount: number;
  durationMinutes: number;
};

export function expandLessonContent(
  domain: DomainSpec,
  level: ProficiencyLevel,
  spec: LevelLessonSpec,
  slug: string,
  originalDurationMinutes: number
): ExpandedLessonContent {
  const vocab = expandVocab(spec.vocab, domain, level);
  const examples = expandExamples(spec.dialogue, vocab, Math.max(2, Math.floor(spec.vocab.length * 0.8)));
  const dialogue = expandDialogue(spec.dialogue, vocab, examples);
  const reviewItems = expandReviewItems(vocab, examples, spec.vocab.length);
  const quizJson = buildExpandedQuiz(
    vocab,
    examples,
    slug,
    Math.max(2, spec.vocab.length),
    domain.slug
  );

  const objectiveText = spec.objectives.map((o) => `・${o}`).join("\n");
  const vocabChunks = chunk(vocab, 5);
  const exampleChunks = chunk(examples, 4);
  const dialogueChunks = chunk(dialogue, 4);
  const reviewChunks = chunk(reviewItems, 5);

  const steps: Record<string, unknown>[] = [
    {
      type: "intro",
      title: "课程导入",
      body: `欢迎来到「${domain.nameZh}」主题中文课。\n\n学习目标：\n${objectiveText}\n\n本课共 ${vocab.length} 个词汇、${examples.length} 条例句、${dialogue.length} 轮对话，请分步完成学习。`,
    },
  ];

  vocabChunks.forEach((items, i) => {
    steps.push({
      type: "vocab",
      title: vocabChunks.length > 1 ? `核心词汇（${i + 1}/${vocabChunks.length}）` : "核心词汇",
      items,
    });
  });

  exampleChunks.forEach((items, i) => {
    steps.push({
      type: "vocab",
      title: exampleChunks.length > 1 ? `例句讲解（${i + 1}/${exampleChunks.length}）` : "例句讲解",
      items,
    });
  });

  dialogueChunks.forEach((lines, i) => {
    steps.push({
      type: "dialogue",
      title: dialogueChunks.length > 1 ? `情景对话（${i + 1}/${dialogueChunks.length}）` : "情景对话",
      lines,
    });
  });

  reviewChunks.forEach((items, i) => {
    steps.push({
      type: "vocab",
      title: reviewChunks.length > 1 ? `复习素材（${i + 1}/${reviewChunks.length}）` : "复习素材",
      items,
    });
  });

  steps.push({
    type: "summary",
    title: "本课小结",
    body: `你已经完成「${spec.title}」的扩充学习。请通过 ${(quizJson.questions as unknown[]).length} 道测验题巩固记忆。`,
  });

  const counts = {
    vocabCount: vocab.length,
    exampleCount: examples.length,
    dialogueCount: dialogue.length,
    reviewCount: reviewItems.length,
    quizCount: (quizJson.questions as unknown[]).length,
    stepCount: steps.length,
  };

  const durationMinutes = Math.round(originalDurationMinutes * 2.5);

  const contentJson = {
    theme: domain.nameZh,
    objectives: spec.objectives,
    estimatedMinutes: durationMinutes,
    originalDurationMinutes,
    expansionFactor: EXPANSION_FACTOR,
    unitMinutesHalved: true,
    contentStats: counts,
    steps,
  };

  return {
    contentJson,
    quizJson,
    ...counts,
    questionCount: counts.quizCount,
    durationMinutes,
  };
}

/** 用于 seed.ts 中无 DomainSpec 的旧模板 */
export function expandLegacyLessonContent(params: {
  theme: string;
  title: string;
  objectives: string[];
  vocab: VocabItem[];
  dialogue: DialogueLine[];
  quiz: Array<{ id: string; question: string; options: string[]; answer: number }>;
  slug: string;
  level: ProficiencyLevel;
  originalDurationMinutes: number;
}): ExpandedLessonContent {
  const fakeDomain: DomainSpec = {
    slug: "legacy",
    nameZh: params.theme,
    nameJa: params.theme,
    category: "general",
    icon: "📘",
    sortOrder: 0,
    lessons: {
      [params.level]: {
        title: params.title,
        description: params.title,
        objectives: params.objectives,
        vocab: params.vocab,
        dialogue: params.dialogue,
      },
    } as DomainSpec["lessons"],
  };

  const spec: LevelLessonSpec = {
    title: params.title,
    description: params.title,
    objectives: params.objectives,
    vocab: params.vocab,
    dialogue: params.dialogue,
  };

  const expanded = expandLessonContent(
    fakeDomain,
    params.level,
    spec,
    params.slug,
    params.originalDurationMinutes
  );

  const mergedQuestions = dedupeQuestions([
    ...params.quiz.map((q, i) => ({ ...q, id: `${params.slug}-legacy-q${i + 1}` })),
    ...(expanded.quizJson.questions as Array<{
      id: string;
      question: string;
      options: string[];
      answer: number;
    }>),
  ]).slice(0, targetCount(params.quiz.length));

  return {
    ...expanded,
    quizJson: { questions: mergedQuestions },
    questionCount: mergedQuestions.length,
  };
}

function dedupeQuestions(
  questions: Array<{ id: string; question: string; options: string[]; answer: number }>
) {
  const seen = new Set<string>();
  return questions.filter((q) => {
    if (seen.has(q.question)) return false;
    seen.add(q.question);
    return true;
  });
}
