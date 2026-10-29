export type SyncDirection = 'read' | 'write';
export type SyncStatus = 'success' | 'skipped' | 'error' | 'permission_denied';

export interface HealthDataType {
  id: string;
  label: string;
  direction: SyncDirection;
  icon: string;
  unit: string;
  /** HKQuantityTypeIdentifier / HKCategoryTypeIdentifier */
  iosType: string;
  /** Health Connect record type string */
  androidType: string;
}

export interface SyncEvent {
  id: string;
  timestamp: string;    // ISO
  dataTypeId: string;
  direction: SyncDirection;
  status: SyncStatus;
  errorMessage?: string;
}

export interface HealthSample {
  dataTypeId: string;
  value: number | string;
  unit: string;
  startDate: string;    // ISO
  endDate: string;      // ISO
  source?: string;
}

/** Returned by the bridge — same shape on both platforms */
export interface HealthReadResult {
  dataTypeId: string;
  samples: HealthSample[];
}

export type PermissionStatus = 'not_determined' | 'granted' | 'denied' | 'unavailable';
