import { test } from "./helpers/test_helper";

test("manage context - default", async ({ po }) => {
  await po.setUp();
  await po.importApp("context-manage");

  const dialog = await po.openContextFilesPicker();
  await po.snapshotDialog();
  await dialog.addManualContextFile("DELETETHIS");
  await dialog.removeManualContextFile();
  await dialog.addManualContextFile("src/**/*.ts");
  await dialog.addManualContextFile("src/sub/**");
  await po.snapshotDialog();
  await dialog.close();

  await po.sendPrompt("[dump]");

  await po.snapshotServerDump("all-messages");
});
