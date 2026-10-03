import type { PairingDevice, PairingPermission, PairingRequest } from "./model";
import type { PairingRepository } from "./repository";

export class PairingService {
  constructor(private readonly repository: PairingRepository) {}

  async requestConnection(
    input: Omit<PairingRequest, "status">,
    requester: PairingDevice,
    target: PairingDevice,
    permission: PairingPermission,
  ): Promise<PairingRequest> {
    if (!permission.canRequest) throw new Error("Device pairing request not permitted");
    if (requester.schoolId !== target.schoolId || requester.schoolId !== input.schoolId) {
      throw new Error("Pairing devices belong to different schools");
    }
    if (requester.deviceId !== input.requesterDeviceId || target.deviceId !== input.targetDeviceId) {
      throw new Error("Pairing request device mismatch");
    }
    if (requester.status !== "ACTIVE" || target.status !== "ACTIVE") {
      throw new Error("Pairing requires active devices");
    }
    if (requester.deviceId === target.deviceId) {
      throw new Error("A device cannot pair with itself");
    }
    const existing = await this.repository.get(input.schoolId, input.pairingId);
    if (existing) return existing;

    const request: PairingRequest = { ...input, status: "PENDING" };
    await this.repository.save(request);
    return request;
  }

  async listPending(
    schoolId: string,
    targetDeviceId: string,
    permission: PairingPermission,
  ): Promise<PairingRequest[]> {
    if (!permission.canApprove) throw new Error("Device pairing approval not permitted");
    return this.repository.listPending(schoolId, targetDeviceId);
  }

  async approve(
    schoolId: string,
    pairingId: string,
    target: PairingDevice,
    approvedByUserId: string,
    permission: PairingPermission,
    reviewedAt: string,
  ): Promise<PairingRequest> {
    if (!permission.canApprove) throw new Error("Device pairing approval not permitted");
    const request = await this.repository.get(schoolId, pairingId);
    if (!request) throw new Error("Pairing request not found");
    if (request.targetDeviceId !== target.deviceId) throw new Error("Pairing request targets another device");
    if (target.schoolId !== schoolId) throw new Error("Pairing device belongs to another school");
    if (target.status !== "ACTIVE") throw new Error("Pairing target device is disabled");
    if (request.status !== "PENDING") throw new Error("Pairing request is no longer pending");

    const approved: PairingRequest = {
      ...request,
      status: "APPROVED",
      reviewedAt,
      reviewedByUserId: approvedByUserId,
    };
    await this.repository.save(approved);
    return approved;
  }

  async reject(
    schoolId: string,
    pairingId: string,
    target: PairingDevice,
    reviewedByUserId: string,
    permission: PairingPermission,
    reviewedAt: string,
  ): Promise<PairingRequest> {
    if (!permission.canApprove) throw new Error("Device pairing approval not permitted");
    const request = await this.repository.get(schoolId, pairingId);
    if (!request) throw new Error("Pairing request not found");
    if (request.targetDeviceId !== target.deviceId) throw new Error("Pairing request targets another device");
    if (target.schoolId !== schoolId) throw new Error("Pairing device belongs to another school");
    if (request.status !== "PENDING") throw new Error("Pairing request is no longer pending");

    const rejected: PairingRequest = {
      ...request,
      status: "REJECTED",
      reviewedAt,
      reviewedByUserId: reviewedByUserId,
    };
    await this.repository.save(rejected);
    return rejected;
  }
}
