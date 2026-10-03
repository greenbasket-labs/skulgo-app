import type { IdentityRole, IdentityStatus, IdentityUser, IdentityDevice, AccessRequest } from "./model";
import type { LocalDevice, LocalUser } from "./repository";

export interface IdentityRepository {
  saveUser(user: LocalUser): Promise<void>;
  getUser(schoolId: string, userId: string): Promise<LocalUser | undefined>;
  listUsers(schoolId: string): Promise<LocalUser[]>;
  saveDevice(device: LocalDevice): Promise<void>;
  getDevice(schoolId: string, deviceId: string): Promise<LocalDevice | undefined>;
  listDevices(schoolId: string): Promise<LocalDevice[]>;
}

const ROLE_MODULES: Record<IdentityRole, string[]> = {
  ADMIN: ["*"],
  TEACHER: ["attendance", "ca", "exam", "messaging", "results", "totals", "grade", "aggregate", "rank", "report-card"],
  CASHIER: ["fees", "cashier", "messaging"],
  PARENT: ["messaging", "fees", "report-card"],
  STUDENT: ["messaging", "report-card"],
};

export class IdentityService {
  constructor(private readonly repository: IdentityRepository) {}

  async createUser(input: {
    userId: string;
    schoolId: string;
    displayName: string;
    role: IdentityRole;
    createdAt: string;
  }): Promise<IdentityUser> {
    const existing = await this.repository.getUser(input.schoolId, input.userId);
    if (existing) throw new Error("User already exists");

    const user: IdentityUser = { ...input, status: "ACTIVE" };
    await this.repository.saveUser(user);
    return user;
  }

  async listUsers(schoolId: string): Promise<IdentityUser[]> {
    return (await this.repository.listUsers(schoolId)).map((user) => ({
      userId: user.userId,
      schoolId: user.schoolId,
      displayName: user.displayName,
      role: user.role as IdentityRole,
      status: (user.status ?? "ACTIVE") as IdentityStatus,
      createdAt: user.createdAt,
    }));
  }

  async disableUser(schoolId: string, userId: string): Promise<void> {
    const user = await this.repository.getUser(schoolId, userId);
    if (!user) throw new Error("User not found");
    await this.repository.saveUser({ ...user, status: "DISABLED" });
  }

  async registerDevice(input: {
    deviceId: string;
    schoolId: string;
    userId: string;
    nodeType: LocalDevice["nodeType"];
    isTrusted?: boolean;
    createdAt: string;
  }): Promise<IdentityDevice> {
    const user = await this.repository.getUser(input.schoolId, input.userId);
    if (!user) throw new Error("User not found");
    if ((user.status ?? "ACTIVE") !== "ACTIVE") throw new Error("User is disabled");

    const existing = await this.repository.getDevice(input.schoolId, input.deviceId);
    if (existing) throw new Error("Device already exists");

    const device: IdentityDevice = {
      ...input,
      isTrusted: input.isTrusted ?? false,
      status: "ACTIVE",
    };
    await this.repository.saveDevice(device);
    return device;
  }

  async listDevices(schoolId: string): Promise<IdentityDevice[]> {
    return (await this.repository.listDevices(schoolId)).map((device) => ({
      deviceId: device.deviceId,
      schoolId: device.schoolId,
      userId: device.userId,
      nodeType: device.nodeType as IdentityDevice["nodeType"],
      isTrusted: device.isTrusted,
      status: (device.status ?? "ACTIVE") as IdentityStatus,
      createdAt: device.createdAt,
      lastSeenAt: device.lastSeenAt,
    }));
  }

  async trustDevice(schoolId: string, deviceId: string): Promise<void> {
    const device = await this.repository.getDevice(schoolId, deviceId);
    if (!device) throw new Error("Device not found");
    await this.repository.saveDevice({ ...device, isTrusted: true });
  }

  async disableDevice(schoolId: string, deviceId: string): Promise<void> {
    const device = await this.repository.getDevice(schoolId, deviceId);
    if (!device) throw new Error("Device not found");
    await this.repository.saveDevice({ ...device, status: "DISABLED" });
  }

  async hasRole(schoolId: string, userId: string, role: IdentityRole): Promise<boolean> {
    const user = await this.repository.getUser(schoolId, userId);
    return !!user && (user.status ?? "ACTIVE") === "ACTIVE" && user.role === role;
  }

  async canAccess(request: AccessRequest): Promise<boolean> {
    const user = await this.repository.getUser(request.schoolId, request.userId);
    if (!user || (user.status ?? "ACTIVE") !== "ACTIVE") return false;

    const role = user.role as IdentityRole;
    const modules = ROLE_MODULES[role] ?? [];
    if (!modules.includes("*") && !modules.includes(request.moduleId)) return false;

    if (role === "TEACHER" && request.resource?.teacherUserId) {
      return request.resource.teacherUserId === user.userId;
    }

    if (request.resource?.visibility === "admin_private") return role === "ADMIN";
    if (request.resource?.visibility === "parent_visible") return role === "ADMIN" || role === "PARENT";
    if (request.resource?.visibility === "student_visible") return role === "ADMIN" || role === "STUDENT";

    return true;
  }
}
