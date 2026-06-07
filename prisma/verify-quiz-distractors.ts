import { PrismaClient } from "@prisma/client";
import { analyzeDistractorReuse, type QuizQuestion } from "./course-data/quiz-distractors";

const prisma = new PrismaClient();

async function main() {
  const template = await prisma.lessonTemplate.findFirst({
    where: { slug: "food-advanced-lesson" },
  });
  if (!template) throw new Error("not found");

  const questions = (template.quizJson as { questions: QuizQuestion[] }).questions;

  const reuse = analyzeDistractorReuse(questions);
  const yanxi = questions.find((q) => q.question.includes("宴席"));
  const pinwei = questions.find((q) => q.question.includes("品味"));

  console.log("Total questions:", questions.length);
  console.log("Repeated distractors (top):", reuse.slice(0, 10));
  console.log("\n宴席:", yanxi);
  console.log("\n品味:", pinwei);

  const sample = questions.slice(0, 5).map((q) => ({
    q: q.question,
    options: q.options,
    answer: q.options[q.answer],
  }));
  console.log("\nFirst 5 questions:", JSON.stringify(sample, null, 2));
}

main()
  .finally(() => prisma.$disconnect());
