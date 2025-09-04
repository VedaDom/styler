import { promises as fs } from "fs";
import path from "path";

async function main() {
  const prismaDir = path.resolve("prisma");
  const basePath = path.join(prismaDir, "base.prisma");
  const modelsDir = path.join(prismaDir, "models");
  const outPath = path.join(prismaDir, "schema.prisma");

  const base = await fs.readFile(basePath, "utf8");

  let modelFiles = [];
  try {
    const entries = await fs.readdir(modelsDir);
    modelFiles = entries
      .filter((f) => f.endsWith(".prisma"))
      .sort();
  } catch (e) {
    // no models dir is okay
  }

  const parts = [base.trim()];
  for (const file of modelFiles) {
    const content = await fs.readFile(path.join(modelsDir, file), "utf8");
    parts.push("\n// --- " + file + " ---\n\n" + content.trim());
  }

  const output = parts.join("\n\n").trim() + "\n";
  await fs.writeFile(outPath, output, "utf8");
  console.log(`Wrote ${outPath} from base.prisma + ${modelFiles.length} model file(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
