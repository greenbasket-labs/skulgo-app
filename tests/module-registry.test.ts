import assert from "node:assert/strict";
import test from "node:test";

import {
  InMemoryModuleRegistryStore,
  SchoolModuleRegistry,
  StaticModuleCatalog,
} from "../packages/shared/src/module-registry";
import type { SchoolModuleManifest } from "../packages/shared/src/module-contract";

const school: SchoolModuleManifest = {
  moduleId: "school",
  version: "1.0.0",
  displayName: "School",
  status: "available",
  dependencies: [],
};

const student: SchoolModuleManifest = {
  moduleId: "student",
  version: "1.0.0",
  displayName: "Student",
  status: "available",
  dependencies: [{ moduleId: "school", contractVersion: "1.0.0", required: true }],
};

test("school can enable modules independently", async () => {
  const registry = new SchoolModuleRegistry(
    new StaticModuleCatalog([school, student]),
    new InMemoryModuleRegistryStore(),
  );

  const result = await registry.enable(
    "school-1",
    "school",
    "admin-1",
    "2026-10-03T08:00:00.000Z",
  );

  assert.equal(result.status, "enabled");

  const studentResult = await registry.enable(
    "school-1",
    "student",
    "admin-1",
    "2026-10-03T08:01:00.000Z",
  );

  assert.equal(studentResult.status, "enabled");
});

test("required dependencies block a module until enabled", async () => {
  const registry = new SchoolModuleRegistry(
    new StaticModuleCatalog([school, student]),
    new InMemoryModuleRegistryStore(),
  );

  const result = await registry.enable(
    "school-1",
    "student",
    "admin-1",
    "2026-10-03T08:00:00.000Z",
  );

  assert.equal(result.status, "blocked");
  if (result.status === "blocked") {
    assert.deepEqual(result.missing.map((dependency) => dependency.moduleId), ["school"]);
  }
});

test("a required module cannot be disabled while another enabled module depends on it", async () => {
  const registry = new SchoolModuleRegistry(
    new StaticModuleCatalog([school, student]),
    new InMemoryModuleRegistryStore(),
  );

  await registry.enable("school-1", "school", "admin-1", "2026-10-03T08:00:00.000Z");
  await registry.enable("school-1", "student", "admin-1", "2026-10-03T08:01:00.000Z");

  await assert.rejects(
    () => registry.disable("school-1", "school"),
    /required by: student/,
  );
});
