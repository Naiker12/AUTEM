import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const bundlePath = "D:/AUTEM/src/data/generated/villa-paraiso-navigation-bundle.json";
const bundle = JSON.parse(fs.readFileSync(bundlePath, "utf8"));

console.log("Preparing SQL query to insert validated navigation bundle into Supabase...");

// Write SQL file to temp
const projectId = "00000000-0000-0000-0000-000000000101";
const payloadJson = JSON.stringify(bundle).replace(/'/g, "''");

const sql = `
BEGIN;
  -- Archive previously published versions
  UPDATE public.project_navigation_versions
  SET status = 'archived'
  WHERE project_id = '${projectId}' AND status = 'published';

  -- Insert new published version
  INSERT INTO public.project_navigation_versions (
    project_id,
    status,
    payload,
    created_by,
    published_by,
    published_at
  ) VALUES (
    '${projectId}',
    'published',
    '${payloadJson}'::jsonb,
    '4ce55542-2c68-4bc3-b3f4-ddd8ebf9c78e'::uuid,
    '4ce55542-2c68-4bc3-b3f4-ddd8ebf9c78e'::uuid,
    now()
  );

  -- Synchronize masterplan_version on projects table
  UPDATE public.projects
  SET masterplan_version = '${bundle.masterplanVersion}'
  WHERE id = '${projectId}';

COMMIT;
`;

const tempSqlPath = "D:/AUTEM/scripts/navigation/temp-publish.sql";
fs.writeFileSync(tempSqlPath, sql, "utf8");

try {
  console.log("Executing SQL via supabase db query --linked -f ...");
  const output = execSync(`npx supabase db query --linked -f "${tempSqlPath}"`, {
    cwd: "D:/AUTEM-BACKEND",
    encoding: "utf8",
  });
  console.log("Supabase response:", output);
  console.log("SUCCESS! Published navigation bundle to Supabase successfully.");
} catch (err) {
  console.error("Error publishing to Supabase:", err.stdout || err.message);
  process.exit(1);
} finally {
  if (fs.existsSync(tempSqlPath)) {
    fs.unlinkSync(tempSqlPath);
  }
}
