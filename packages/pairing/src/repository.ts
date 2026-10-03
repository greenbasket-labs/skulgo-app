import type { PairingRequest } from "./model";

export interface PairingRepository {
  save(request: PairingRequest): Promise<void>;
  get(schoolId: string, pairingId: string): Promise<PairingRequest | undefined>;
  listPending(schoolId: string, targetDeviceId?: string): Promise<PairingRequest[]>;
}
