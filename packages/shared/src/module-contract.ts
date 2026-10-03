export type ModuleStatus = "available" | "enabled" | "disabled" | "deprecated";

export interface ModuleDependency {
  moduleId: string;
  contractVersion: string;
  required: boolean;
}

export interface SchoolModuleManifest {
  moduleId: string;
  version: string;
  displayName: string;
  status: ModuleStatus;
  dependencies: ModuleDependency[];
}

export interface EnabledSchoolModule {
  schoolId: string;
  moduleId: string;
  moduleVersion: string;
  enabledAt: string;
  enabledByUserId: string;
}

export interface ModuleContract<TRequest = unknown, TResponse = unknown> {
  moduleId: string;
  contractVersion: string;
  handle(request: TRequest): Promise<TResponse>;
}