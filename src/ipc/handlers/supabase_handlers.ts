import log from "electron-log";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import { apps } from "../../db/schema";
import { getSupabaseClient } from "../../supabase_admin/supabase_management_client";
import {
  createLoggedHandler,
  createTestOnlyLoggedHandler,
} from "./safe_handle";
import { handleSupabaseOAuthReturn } from "../../supabase_admin/supabase_return_handler";
import { safeSend } from "../utils/safe_sender";
import crypto from "crypto";

const logger = log.scope("supabase_handlers");
const handle = createLoggedHandler(logger);
const testOnlyHandle = createTestOnlyLoggedHandler(logger);

export function registerSupabaseHandlers() {
  handle("supabase:list-projects", async () => {
    const supabase = await getSupabaseClient();
    return supabase.getProjects();
  });

  // Create new Supabase project
  handle(
    "supabase:create-project",
    async (_, { name, appId }: { name: string; appId: number }) => {
      const supabase = await getSupabaseClient();

      try {
        logger.info(`Creating Supabase project: ${name} for app ${appId}`);

        // Create the project using the Supabase Management API
        const projectData = await supabase.createProject({
          name: name,
          organization_id: await getDefaultOrganizationId(supabase),
          region: "us-east-1", // Default region
          db_pass: generateSecurePassword(), // Generate a secure password
        });

        if (!projectData || !projectData.id) {
          throw new Error("Failed to create project: No project ID returned.");
        }

        // Store project info in the app's DB row
        await db
          .update(apps)
          .set({
            supabaseProjectId: projectData.id,
          })
          .where(eq(apps.id, appId));

        logger.info(
          `Successfully created Supabase project: ${projectData.id} with name: ${projectData.name}`,
        );

        return projectData;
      } catch (error) {
        logger.error("[Supabase Handler] Failed to create project:", error);
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to create Supabase project.",
        );
      }
    },
  );

  // Set app project - links a Dyad app to a Supabase project
  handle(
    "supabase:set-app-project",
    async (_, { project, app }: { project: string; app: number }) => {
      await db
        .update(apps)
        .set({ supabaseProjectId: project })
        .where(eq(apps.id, app));

      logger.info(`Associated app ${app} with Supabase project ${project}`);
    },
  );

  // Unset app project - removes the link between a Dyad app and a Supabase project
  handle("supabase:unset-app-project", async (_, { app }: { app: number }) => {
    await db
      .update(apps)
      .set({ supabaseProjectId: null })
      .where(eq(apps.id, app));

    logger.info(`Removed Supabase project association for app ${app}`);
  });

  testOnlyHandle(
    "supabase:fake-connect-and-set-project",
    async (
      event,
      { appId, fakeProjectId }: { appId: number; fakeProjectId: string },
    ) => {
      // Call handleSupabaseOAuthReturn with fake data
      handleSupabaseOAuthReturn({
        token: "fake-access-token",
        refreshToken: "fake-refresh-token",
        expiresIn: 3600, // 1 hour
      });
      logger.info(
        `Called handleSupabaseOAuthReturn with fake data for app ${appId} during testing.`,
      );

      // Set the supabase project for the currently selected app
      await db
        .update(apps)
        .set({
          supabaseProjectId: fakeProjectId,
        })
        .where(eq(apps.id, appId));
      logger.info(
        `Set fake Supabase project ${fakeProjectId} for app ${appId} during testing.`,
      );

      // Simulate the deep link event
      safeSend(event.sender, "deep-link-received", {
        type: "supabase-oauth-return",
        url: "https://athena-production-9c6e.up.railway.app/supabase/oauth/login",
      });
      logger.info(
        `Sent fake deep-link-received event for app ${appId} during testing.`,
      );
    },
  );
}

// Helper function to generate a secure password
function generateSecurePassword(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Helper function to get the default organization ID
async function getDefaultOrganizationId(supabase: any): Promise<string> {
  try {
    const organizations = await supabase.getOrganizations();
    if (organizations && organizations.length > 0) {
      return organizations[0].id;
    }
    throw new Error(
      "No organizations found. Please create an organization in Supabase first.",
    );
  } catch (error) {
    logger.error("Failed to get default organization:", error);
    throw new Error(
      "Failed to get organization. Please ensure you have access to a Supabase organization.",
    );
  }
}
