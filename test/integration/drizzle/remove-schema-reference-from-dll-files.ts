import { readFile, readdir, writeFile } from "fs/promises";
import { resolve } from "path";

// remove explicit reference to public schema from drizzle migration ddl files. This is necessary to run migrations on different schemas in the integration testing setup.

(async () => {
  const testMigrationsDirname = resolve(__dirname, "./migrations");
  const testMigrationsFilenames = await readdir(testMigrationsDirname);
  const testMigrationsDdlFilePaths = await Promise.all(
    testMigrationsFilenames
      .filter(item => item.endsWith(".sql"))
      .map(fileName => resolve(testMigrationsDirname, fileName)),
  );

  await Promise.all(
    testMigrationsDdlFilePaths.map(async ddlFilePath => {
      const ddlFileContent = await readFile(ddlFilePath, { encoding: "utf-8" });

      await writeFile(ddlFilePath, ddlFileContent.replace(/"public"./g, ""));
    }),
  );
})();
