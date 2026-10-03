import type { ConnectionDevice } from "./model";
import type { ConnectionRepository } from "./repository";

export class ConnectionInMemoryRepository implements ConnectionRepository {
  private readonly devices = new Map<string, ConnectionDevice>();

  async save(device: ConnectionDevice): Promise<void> {
    this.devices.set(`${device.schoolId}:${device.deviceId}`, device);
  }

  async get(schoolId: string, deviceId: string): Promise<ConnectionDevice | undefined> {
    return this.devices.get(`${schoolId}:${deviceId}`);
  }

  async list(schoolId: string): Promise<ConnectionDevice[]> {
    return [...this.devices.values()].filter((device) => device.schoolId === schoolId);
  }
}
