export type ConnectionStatus = "PAIRED" | "CONNECTED" | "OFFLINE" | "DISCONNECTED";

export interface ConnectionDevice {
  deviceId: string;
  schoolId: string;
  displayName: string;
  userId: string;
  status: ConnectionStatus;
  lastSeenAt?: string;
}

export interface ConnectionPermission {
  canView: boolean;
  canUpdate: boolean;
}
