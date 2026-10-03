import type { LocalDevice, LocalUser } from "./repository";
import type { IdentityRepository } from "./service";

export class IdentityInMemoryRepository implements IdentityRepository {
  private readonly users = new Map<string, LocalUser>();
  private readonly devices = new Map<string, LocalDevice>();

  async saveUser(user: LocalUser): Promise<void> {
    this.users.set(`${user.schoolId}:${user.userId}`, user);
  }

  async getUser(schoolId: string, userId: string): Promise<LocalUser | undefined> {
    return this.users.get(`${schoolId}:${userId}`);
  }

  async listUsers(schoolId: string): Promise<LocalUser[]> {
    return [...this.users.values()].filter((user) => user.schoolId === schoolId);
  }

  async saveDevice(device: LocalDevice): Promise<void> {
    this.devices.set(`${device.schoolId}:${device.deviceId}`, device);
  }

  async getDevice(schoolId: string, deviceId: string): Promise<LocalDevice | undefined> {
    return this.devices.get(`${schoolId}:${deviceId}`);
  }

  async listDevices(schoolId: string): Promise<LocalDevice[]> {
    return [...this.devices.values()].filter((device) => device.schoolId === schoolId);
  }
}
