/**
 * 将 interest_tags.name_en 重命名为 name_ja（在 prisma db push 之前运行一次）
 * 用法: pnpm db:migrate-ja
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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
        RAISE NOTICE 'Renamed name_en to name_ja';
      ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'interest_tags'
          AND column_name = 'name_ja'
      ) THEN
        RAISE NOTICE 'Column name_ja already exists';
      ELSE
        RAISE EXCEPTION 'interest_tags table missing name_en/name_ja column';
      END IF;
    END $$;
  `);
  console.log("Column migration OK.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
