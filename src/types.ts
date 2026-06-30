/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TrademarkRecord {
  id: string; // The certificate / registration number
  proprietor: string;
  proprietorAr: string;
  trademarkName: string;
  trademarkNameAr: string;
  classNumber: number;
  goodsServices: string;
  goodsServicesAr: string;
  applicationDate: string;
  registrationDate: string;
  validityDate: string;
  address: string;
  addressAr: string;
  imageLogo?: string; // Base64 encoded string
  logoStyle: 'stylized-text' | 'uploaded-image';
  updatedAt: number; // For synchronization logic (timestamp)
  status: 'active' | 'expired' | 'pending' | 'cancelled';
  syncStatus: 'synced' | 'local-only' | 'conflict' | 'offline-draft';
  isDeleted?: boolean; // Soft delete flag for replication sync
}

export interface SyncConflict {
  id: string;
  local: TrademarkRecord;
  remote: TrademarkRecord;
}

export interface SyncPayload {
  records: TrademarkRecord[];
  clientTime: number;
}

export interface SyncResponse {
  mergedRecords: TrademarkRecord[];
  conflictRecords: TrademarkRecord[];
}
