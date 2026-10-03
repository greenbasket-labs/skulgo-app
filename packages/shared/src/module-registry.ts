import type {
  EnabledSchoolModule,
  ModuleDependency,
  ModuleStatus,
  SchoolModuleManifest,
} from "./module-contract";

export interface ModuleRegistryStore {
  list(schoolId: string): Promise<EnabledSchoolModule[]>;
  get(schoolId: string, moduleId: string): Promise<EnabledSchoolModule | undefined>;
  enable(module: EnabledSchoolModule): Promise<void>;
  disable(schoolId: string, moduleId: string): Promise<void>;
}

export interface ModuleCatalog {
  get(moduleId: string): SchoolModuleManifest | undefined;
  list(): SchoolModuleManifest[];
}

export type ModuleEnableResult =
  | { status: "enabled"; module: EnabledSchoolModule }
  | { status: "already_enabled"; module: EnabledSchoolModule }
  | { status: "blocked"; missing: ModuleDependency[] };

export class InMemoryModuleRegistryStore implements ModuleRegistryStore {
  private readonly modules = new Map<string, EnabledSchoolModule>();

  async list(schoolId: string): Promise<EnabledSchoolModule[]> {
    return [...this.modules.values()].filter((m) => m.schoolId === schoolId);
  }

  async get(
    schoolId: string,
    moduleId: string,
  ): Promise<EnabledSchoolModule | undefined> {
    return this.modules.get(`${schoolId}:${moduleId}`);
  }

  async enable(module: EnabledSchoolModule): Promise<void> {
    this.modules.set(`${module.schoolId}:${module.moduleId}`, module);
  }

  async disable(schoolId: string, moduleId: string): Promise<void> {
    this.modules.delete(`${schoolId}:${moduleId}`);
  }
}

export class StaticModuleCatalog implements ModuleCatalog {
  constructor(private readonly manifests: SchoolModuleManifest[]) {}

  get(moduleId: string): SchoolModuleManifest | undefined {
    return this.manifests.find((manifest) => manifest.moduleId === moduleId);
  }

  list(): SchoolModuleManifest[] {
    return [...this.manifests];
  }
}

export class SchoolModuleRegistry {
  constructor(
    private readonly catalog: ModuleCatalog,
    private readonly store: ModuleRegistryStore,
  ) {}

  async enable(
    schoolId: string,
    moduleId: string,
    enabledByUserId: string,
    enabledAt: string,
  ): Promise<ModuleEnableResult> {
    const manifest = this.catalog.get(moduleId);
    if (!manifest || manifest.status === "deprecated") {
      throw new Error(`Module is not available: ${moduleId}`);
    }

    const existing = await this.store.get(schoolId, moduleId);
    if (existing) {
      return { status: "already_enabled", module: existing };
    }

    const enabled = new Set(
      (await this.store.list(schoolId)).map((module) => module.moduleId),
    );

    const missing = manifest.dependencies.filter(
      (dependency) => dependency.required && !enabled.has(dependency.moduleId),
    );

    if (missing.length > 0) {
      return { status: "blocked", missing };
    }

    const module: EnabledSchoolModule = {
      schoolId,
      moduleId,
      moduleVersion: manifest.version,
      enabledAt,
      enabledByUserId,
    };

    await this.store.enable(module);
    return { status: "enabled", module };
  }

  async disable(schoolId: string, moduleId: string): Promise<void> {
    const enabled = await this.store.get(schoolId, moduleId);
    if (!enabled) return;

    const dependents = (await this.store.list(schoolId)).filter((candidate) => {
      const manifest = this.catalog.get(candidate.moduleId);
      return manifest?.dependencies.some(
        (dependency) =>
          dependency.required && dependency.moduleId === moduleId,
      );
    });

    if (dependents.length > 0) {
      throw new Error(
        `Cannot disable ${moduleId}; required by: ${dependents
          .map((module) => module.moduleId)
          .join(", ")}`,
      );
    }

    await this.store.disable(schoolId, moduleId);
  }
}
