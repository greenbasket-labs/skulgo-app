export type PairingStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface PairingRequest {
  pairingId: string;
  schoolId: string;
  requesterDeviceId: string;
  requesterUserId: string;
  targetDeviceId: string;
  status: PairingStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedByUserId?: string;
}

export interface PairingPermission {
  canRequest: boolean;
  canApprove: boolean;
}

export interface PairingDevice {
  deviceId: string;
  schoolId: string;
  userId: string;
  nodeType: string;
  isTrusted: boolean;
  status: "ACTIVE" | "DISABLED";
}
