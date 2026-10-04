import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
try {
  const db = new PGlite();
  await db.exec(
    `create schema auth;create role anon;create role authenticated;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create table projects(id uuid primary key,organization_id uuid,status text,slug text,masterplan_version text);create table organization_members(organization_id uuid,user_id uuid,role text);create table lots(id uuid primary key,project_id uuid,external_id text);create function can_manage_organization(id uuid) returns boolean language sql stable as $$select exists(select 1 from organization_members m where m.organization_id=id and m.user_id=auth.uid() and m.role='superadmin')$$;grant usage on schema public,auth to anon,authenticated;grant select on projects,organization_members,lots to anon,authenticated;`,
  );
  await db.exec(
    await readFile(
      new URL("../supabase/migrations/202610040001_navigation_versions.sql", import.meta.url),
      "utf8",
    ),
  );
  const fixture = JSON.parse(
    await readFile(new URL("../tmp/navigation-tests/fixture.json", import.meta.url), "utf8"),
  );
  const admin = "00000000-0000-0000-0000-000000000001",
    project = "00000000-0000-0000-0000-000000000002",
    org = "00000000-0000-0000-0000-000000000003";
  await db.query("insert into auth.users values($1)", [admin]);
  await db.query("insert into projects values($1,$2,'published','test-project',null)", [
    project,
    org,
  ]);
  await db.query("insert into organization_members values($1,$2,'superadmin')", [org, admin]);
  await db.query("insert into lots values($1,$2,'L-45')", [
    "00000000-0000-0000-0000-000000000004",
    project,
  ]);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [admin]);
  await db.exec("set role authenticated");
  async function save(payload) {
    return (
      await db.query(
        "insert into project_navigation_versions(project_id,payload) values($1,$2) returning id",
        [project, JSON.stringify(payload)],
      )
    ).rows[0].id;
  }
  const draft = await save(fixture);
  await db.exec("set role anon");
  if ((await db.query("select * from project_navigation_versions")).rows.length !== 0)
    throw new Error("Draft visible to anon");
  await db.exec("set role authenticated");
  for (const mutate of [
    (f) => (f.edges[0].to = "unknown"),
    (f) => (f.edges[0].isOpen = false),
    (f) => (f.edges[0].lengthMeters = 1),
    (f) => (f.calibration.controls[0].accuracy = null),
    (f) => (f.calibration.checkpoints[1] = f.calibration.checkpoints[0]),
    (f) => (f.calibration.checkpoints[0].point.x += 100),
    (f) => (f.destinations[0].lotId = "foreign-lot"),
  ]) {
    const bad = structuredClone(fixture);
    mutate(bad);
    const id = await save(bad);
    let rejected = false;
    try {
      await db.query("select publish_project_navigation($1)", [id]);
    } catch {
      rejected = true;
    }
    if (!rejected) throw new Error("Invalid publication accepted");
  }
  let blocked = false;
  try {
    await db.query("update project_navigation_versions set status='published' where id=$1", [
      draft,
    ]);
  } catch {
    blocked = true;
  }
  if (!blocked) throw new Error("Direct publish allowed");
  await db.query("select publish_project_navigation($1)", [draft]);
  await db.exec("set role anon");
  const publicRows = (await db.query("select * from project_navigation_versions")).rows;
  if (publicRows.length !== 1 || publicRows[0].id !== draft)
    throw new Error("Published visibility failed");
  await db.exec("set role authenticated");
  const replacement = await save({ ...fixture, version: "test-v2" });
  await db.query("select publish_project_navigation($1)", [replacement]);
  await db.exec("set role anon");
  if ((await db.query("select * from project_navigation_versions")).rows.length !== 1)
    throw new Error("Atomic replacement failed");
  await db.exec("reset role");
  await db.query(
    "select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000009',false)",
  );
  await db.exec("set role authenticated");
  let unauthorized = false;
  try {
    await db.query("select publish_project_navigation($1)", [draft]);
  } catch {
    unauthorized = true;
  }
  if (!unauthorized) throw new Error("Unauthorized publication accepted");
  console.log(
    "PostgreSQL: migración, borradores privados, publicación válida, rechazo de datos inválidos, roles y reemplazo atómico comprobados.",
  );
  await db.close();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
