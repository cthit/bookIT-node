import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { codegen } from "@graphql-codegen/core";
import * as typescript from "@graphql-codegen/typescript";
import * as operations from "@graphql-codegen/typescript-operations";
import * as resolvers from "@graphql-codegen/typescript-resolvers";
import * as documentNode from "@graphql-codegen/typed-document-node";
import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeTypeDefs } from "@graphql-tools/merge";
import { type DocumentNode } from "graphql";

async function generate() {
  const schema = mergeTypeDefs(loadFilesSync("backend/src/schemas/v1/*.gql"));

  const documents = loadFilesSync<DocumentNode>("frontend/src/**/*.graphql").map((document) => ({
    document,
  }));

  const config = { useTypeImports: true, enumsAsTypes: true };

  const outputs = [
    {
      filename: "frontend/src/generated/graphql.ts",
      content: await codegen({
        schema,
        documents,
        config,
        filename: "frontend/src/generated/graphql.ts",
        plugins: [{ operations: {} }, { documentNode: {} }],
        pluginMap: { operations, documentNode },
      }),
    },
    {
      filename: "backend/src/generated/schema.ts",
      content: await codegen({
        schema,
        documents: [],
        filename: "backend/src/generated/schema.ts",
        config: { ...config, contextType: "../utils/commonTypes#Context" },
        plugins: [{ typescript: {} }, { resolvers: {} }],
        pluginMap: { typescript, resolvers },
      }),
    },
  ];

  for (const { filename, content } of outputs) {
    await mkdir(dirname(filename), { recursive: true });
    await writeFile(filename, `${content.trimEnd()}\n`);
    console.log(`Generated ${filename}`);
  }
}

void generate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
