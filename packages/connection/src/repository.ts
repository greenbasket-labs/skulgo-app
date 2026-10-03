import type { ConnectionDevice } from "./model";

export interface ConnectionRepository {
  save(device: ConnectionDevice): Promise<void>;
  get(schoolId: string, deviceId: string): Promise<ConnectionDevice | undefined>;
  list(schoolId: string): Promise<ConnectionDevice[]>;
}
