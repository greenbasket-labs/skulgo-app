import type { PairingRepository } from "./repository";
import type { PairingRequest } from "./model";

export class PairingInMemoryRepository implements PairingRepository {
  private readonly requests = new Map<string, PairingRequest>();

  async save(request: PairingRequest): Promise<void> {
    this.requests.set(`${request.schoolId}:${request.pairingId}`, request);
  }

  async get(schoolId: string, pairingId: string): Promise<PairingRequest | undefined> {
    return this.requests.get(`${schoolId}:${pairingId}`);
  }

  async listPending(schoolId: string, targetDeviceId?: string): Promise<PairingRequest[]> {
    return [...this.requests.values()].filter((request) =>
      request.schoolId === schoolId &&
      request.status === "PENDING" &&
      (!targetDeviceId || request.targetDeviceId === targetDeviceId)
    );
  }
}
