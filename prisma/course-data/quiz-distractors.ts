import type { VocabItem } from "./types";

/** 各主题备用干扰项池（日文，语义相近但多样化） */
const DOMAIN_THEME_DISTRACTORS: Record<string, string[]> = {
  anime: [
    "キャラクター",
    "ストーリー",
    "作画",
    "声優",
    "展開",
    "シーン",
    "登場人物",
    "セリフ",
    "伏線",
    "結末",
    "感想",
    "おすすめ",
    "視聴",
    "ファン",
    "作品",
  ],
  food: [
    "食事",
    "祝い",
    "香り",
    "料理",
    "味",
    "材料",
    "調理",
    "予約",
    "席",
    "飲み物",
    "デザート",
    "店員",
    "会計",
    "定食",
    "弁当",
  ],
  travel: [
    "観光",
    "宿泊",
    "交通",
    "地図",
    "荷物",
    "案内",
    "予約",
    "観光地",
    "空港",
    "切符",
    "旅程",
    "写真",
    "記念",
    "案内所",
    "時差",
  ],
  business: [
    "会議",
    "報告",
    "契約",
    "提案",
    "協力",
    "交渉",
    "資料",
    "締め切り",
    "承認",
    "連絡",
    "取引",
    "計画",
    "目標",
    "成果",
    "担当",
  ],
  music: [
    "メロディー",
    "歌詞",
    "ライブ",
    "アルバム",
    "リズム",
    "演奏",
    "楽器",
    "コンサート",
    "合唱",
    "音源",
    "イントロ",
    "サビ",
    "アンコール",
    "ファン",
    "曲調",
  ],
  sports: [
    "試合",
    "練習",
    "チーム",
    "得点",
    "作戦",
    "選手",
    "観客",
    "優勝",
    "記録",
    "トレーニング",
    "怪我",
    "審判",
    "遠征",
    "応援",
    "大会",
  ],
  tech: [
    "アプリ",
    "機能",
    "更新",
    "設定",
    "接続",
    "データ",
    "端末",
    "開発",
    "仕様",
    "操作",
    "画面",
    "通知",
    "検索",
    "保存",
    "同期",
  ],
  history: [
    "時代",
    "人物",
    "事件",
    "文化",
    "遺跡",
    "王朝",
    "記録",
    "研究",
    "伝統",
    "遺産",
    "年表",
    "文献",
    "考察",
    "背景",
    "影響",
  ],
  gaming: [
    "クエスト",
    "装備",
    "レベル",
    "スキル",
    "ステージ",
    "報酬",
    "パーティ",
    "対戦",
    "攻略",
    "操作",
    "設定",
    "アイテム",
    "ランク",
    "イベント",
    "配信",
  ],
  movies: [
    "監督",
    "俳優",
    "脚本",
    "撮影",
    "音楽",
    "場面",
    "評価",
    "上映",
    "予告",
    "シーン",
    "結末",
    "登場人物",
    "作品",
    "鑑賞",
    "ネタバレ",
  ],
  shopping: [
    "商品",
    "値段",
    "サイズ",
    "色",
    "在庫",
    "試着",
    "返品",
    "配送",
    "支払い",
    "割引",
    "店舗",
    "注文",
    "レビュー",
    "包装",
    "保証",
  ],
  workplace: [
    "同僚",
    "上司",
    "部署",
    "業務",
    "残業",
    "面接",
    "給与",
    "評価",
    "報告",
    "会議",
    "目標",
    "研修",
    "転勤",
    "契約",
    "退勤",
  ],
  "daily-life": [
    "起床",
    "通勤",
    "買い物",
    "家事",
    "洗濯",
    "掃除",
    "睡眠",
    "予定",
    "休憩",
    "病院",
    "薬",
    "食事",
    "天気",
    "電話",
    "予約",
  ],
  social: [
    "挨拶",
    "紹介",
    "約束",
    "連絡",
    "相談",
    "共感",
    "距離",
    "信頼",
    "話題",
    "趣味",
    "近況",
    "久しぶり",
    "誘い",
    "別れ",
    "近所",
  ],
  legacy: [
    "挨拶",
    "感謝",
    "質問",
    "返事",
    "説明",
    "確認",
    "提案",
    "同意",
    "時間",
    "場所",
  ],
  general: [
    "説明",
    "質問",
    "返事",
    "確認",
    "提案",
    "同意",
    "反対",
    "理由",
    "結果",
    "方法",
  ],
};

export function normalizeMeaning(raw: string): string {
  return raw
    .replace(/^【[^】]+】/, "")
    .split(/[/／]/)[0]
    .split(/[・]/)[0]
    .trim();
}

function meaningVariants(raw: string): string[] {
  const base = raw.replace(/^【[^】]+】/, "").trim();
  const parts = base.split(/[/／・]/).map((p) => p.trim()).filter(Boolean);
  return parts.length ? parts : [base];
}

function isTooSimilar(correct: string, candidate: string): boolean {
  const cKeys = meaningVariants(correct).map(normalizeMeaning);
  const dKeys = meaningVariants(candidate).map(normalizeMeaning);
  for (const ck of cKeys) {
    for (const dk of dKeys) {
      if (!ck || !dk) continue;
      if (ck === dk) return true;
      if (ck.length >= 3 && dk.length >= 3 && (ck.includes(dk) || dk.includes(ck))) return true;
    }
  }
  return false;
}

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h || 1;
}

export function shuffle<T>(arr: T[], seed = 0): T[] {
  const copy = [...arr];
  let s = seed || 1;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function rotate<T>(arr: T[], offset: number): T[] {
  if (arr.length === 0) return arr;
  const o = ((offset % arr.length) + arr.length) % arr.length;
  return [...arr.slice(o), ...arr.slice(0, o)];
}

function isLexicalMeaning(raw: string): boolean {
  const display = raw.replace(/^【[^】]+】/, "").trim();
  if (display.length > 22) return false;
  if (/[。！？]/.test(display) && display.length > 10) return false;
  if (/です$|ます$|ください|好きです|これは|について|を使って/.test(display)) return false;
  return true;
}

function uniqueMeanings(items: string[], lexicalOnly = false): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const display = item.replace(/^【[^】]+】/, "").trim();
    if (lexicalOnly && !isLexicalMeaning(display)) continue;
    const key = normalizeMeaning(display);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(display);
  }
  return out;
}

export class DistractorSelector {
  private usedInLesson = new Set<string>();
  private lastDistractors: string[] = [];

  constructor(
    private lessonMeanings: string[],
    private themeMeanings: string[],
    private slug: string
  ) {}

  pick(correct: string, questionIndex: number): string[] {
    const lessonCandidates = this.lessonMeanings.filter(
      (m) =>
        isLexicalMeaning(m) &&
        !isTooSimilar(correct, m) &&
        normalizeMeaning(m) !== normalizeMeaning(correct)
    );
    const themeCandidates = this.themeMeanings.filter(
      (m) => !isTooSimilar(correct, m) && normalizeMeaning(m) !== normalizeMeaning(correct)
    );

    const rotatedLesson = rotate(lessonCandidates, questionIndex * 2 + 1);
    const rotatedTheme = rotate(
      themeCandidates,
      questionIndex * 3 + hashSeed(this.slug) % 7
    );
    const rotatedGeneral = rotate(
      DOMAIN_THEME_DISTRACTORS.general.filter(
        (m) => !isTooSimilar(correct, m) && normalizeMeaning(m) !== normalizeMeaning(correct)
      ),
      questionIndex * 5 + 3
    );

    const picked: string[] = [];

    const tryPick = (
      candidates: string[],
      allowUsed: boolean,
      avoidLast: boolean
    ) => {
      for (const c of candidates) {
        if (picked.length >= 2) break;
        if (isTooSimilar(correct, c)) continue;
        if (picked.some((p) => normalizeMeaning(p) === normalizeMeaning(c))) continue;
        if (!allowUsed && this.usedInLesson.has(normalizeMeaning(c))) continue;
        if (
          avoidLast &&
          this.lastDistractors.some((d) => normalizeMeaning(d) === normalizeMeaning(c))
        ) {
          continue;
        }
        picked.push(c);
        this.usedInLesson.add(normalizeMeaning(c));
      }
    };

    const passes: Array<{ pool: string[]; allowUsed: boolean; avoidLast: boolean }> = [
      { pool: rotatedTheme, allowUsed: false, avoidLast: true },
      { pool: rotatedLesson, allowUsed: false, avoidLast: true },
      { pool: rotatedTheme, allowUsed: false, avoidLast: false },
      { pool: rotatedLesson, allowUsed: false, avoidLast: false },
      { pool: rotatedTheme, allowUsed: true, avoidLast: true },
      { pool: rotatedLesson, allowUsed: true, avoidLast: false },
      { pool: rotatedGeneral, allowUsed: false, avoidLast: false },
      { pool: rotatedGeneral, allowUsed: true, avoidLast: false },
    ];

    for (const pass of passes) {
      if (picked.length >= 2) break;
      tryPick(pass.pool, pass.allowUsed, pass.avoidLast);
    }

    while (picked.length < 2) {
      const fallback = `関連語${questionIndex + picked.length + 1}`;
      if (!picked.includes(fallback) && !isTooSimilar(correct, fallback)) {
        picked.push(fallback);
      } else {
        picked.push(`選択肢${questionIndex + picked.length + 1}`);
      }
    }

    this.lastDistractors = [...picked];
    return picked.slice(0, 2);
  }
}

export function buildLessonMeaningPool(vocab: VocabItem[], examples: VocabItem[]): string[] {
  return uniqueMeanings(
    [...vocab.map((v) => v.meaning), ...examples.map((e) => e.meaning)],
    true
  );
}

export function getThemeDistractorPool(domainSlug: string): string[] {
  return DOMAIN_THEME_DISTRACTORS[domainSlug] ?? DOMAIN_THEME_DISTRACTORS.general;
}

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  answer: number;
};

export function buildQuizQuestion(params: {
  id: string;
  question: string;
  correct: string;
  selector: DistractorSelector;
  questionIndex: number;
  slug: string;
}): QuizQuestion {
  const distractors = params.selector.pick(params.correct, params.questionIndex);
  const options = shuffle(
    [params.correct.replace(/^【[^】]+】/, "").trim(), ...distractors],
    hashSeed(`${params.slug}-opt-${params.questionIndex}`)
  );
  const displayCorrect = params.correct.replace(/^【[^】]+】/, "").trim();
  let answer = options.findIndex(
    (o) => normalizeMeaning(o) === normalizeMeaning(displayCorrect)
  );
  if (answer < 0) {
    answer = options.indexOf(displayCorrect);
  }
  if (answer < 0) {
    answer = 0;
  }
  return {
    id: params.id,
    question: params.question,
    options,
    answer,
  };
}

export function buildExpandedQuizWithDistractors(
  vocab: VocabItem[],
  examples: VocabItem[],
  slug: string,
  baseQuestionCount: number,
  domainSlug: string
) {
  const target = Math.max(2, Math.ceil(Math.max(2, baseQuestionCount) * 5));
  const lessonPool = buildLessonMeaningPool(vocab, examples);
  const themePool = getThemeDistractorPool(domainSlug);
  const selector = new DistractorSelector(lessonPool, themePool, slug);
  const questions: QuizQuestion[] = [];

  for (const item of vocab) {
    if (questions.length >= target) break;
    if (!isLexicalMeaning(item.meaning)) continue;
    const q = buildQuizQuestion({
      id: `${slug}-q${questions.length + 1}`,
      question: `「${item.hanzi}」の意味は？`,
      correct: item.meaning,
      selector,
      questionIndex: questions.length,
      slug,
    });
    if (q.answer >= 0 && q.options.length === 3) questions.push(q);
  }

  return { questions: questions.slice(0, target) };
}

/** 统计一课内干扰项重复情况（开发自查用） */
export function analyzeDistractorReuse(questions: QuizQuestion[]) {
  const counts = new Map<string, number>();
  for (const q of questions) {
    const correct = q.options[q.answer];
    for (const opt of q.options) {
      if (opt === correct) continue;
      const key = normalizeMeaning(opt);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, n]) => n > 1)
    .sort((a, b) => b[1] - a[1]);
}
