import type {
  ConnectionDevice,
  ConnectionPermission,
  ConnectionStatus,
} from "./model";
import type { ConnectionRepository } from "./repository";

export class ConnectionService {
  constructor(private readonly repository: ConnectionRepository) {}

  async listDevices(
    schoolId: string,
    permission: ConnectionPermission,
  ): Promise<ConnectionDevice[]> {
    if (!permission.canView) throw new Error("Connection status viewing not permitted");
    return this.repository.list(schoolId);
  }

  async updateStatus(
    schoolId: string,
    deviceId: string,
    status: ConnectionStatus,
    lastSeenAt: string | undefined,
    permission: ConnectionPermission,
  ): Promise<ConnectionDevice> {
    if (!permission.canUpdate) throw new Error("Connection status update not permitted");
    const device = await this.repository.get(schoolId, deviceId);
    if (!device) throw new Error("Connection device not found");

    const updated: ConnectionDevice = {
      ...device,
      status,
      lastSeenAt: lastSeenAt ?? device.lastSeenAt,
    };
    await this.repository.save(updated);
    return updated;
  }

  async getDevice(
    schoolId: string,
    deviceId: string,
    permission: ConnectionPermission,
  ): Promise<ConnectionDevice | undefined> {
    if (!permission.canView) throw new Error("Connection status viewing not permitted");
    return this.repository.get(schoolId, deviceId);
  }
}
