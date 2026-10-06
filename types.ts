

export enum PolicyCategory {
  HEALTH = '健康险',
  VEHICLE = '车险',
  LIFE = '人寿/意外险',
  PROPERTY = '财产险',
  LIABILITY = '责任险'
}

export type PolicyStatus = 'Active' | 'Expired' | 'Pending';

export interface Policy {
  id: string;
  name: string;
  insurer: string;
  policyNumber: string;
  category: PolicyCategory;
  insuredPerson: string; // Primary insured
  otherInsuredPersons?: string[]; // Additional insured persons (e.g., family members)
  premium: number; // Annualized premium for calculation
  premiumDisplay: string; // Display string e.g., "300.00 / year"
  coverageAmount: number;
  coverageDisplay: string;
  startDate: string;
  endDate: string;
  status: PolicyStatus;
  tags: string[];
  
  // File Management Fields
  sourceFile: string; // The name of the file
  fileSize?: number; // In bytes
  fileType?: string; // e.g., 'application/pdf'
  lastModified?: string; // ISO String of upload/modify time
}

// Fix: Add activeCount and expiredCount to DashboardStats
export interface DashboardStats {
  totalPremium: number;
  totalCoverage: number;
  policyCount: number;
  activeCount: number;
  expiredCount: number;
  expiringSoon: number;
}

export interface Note {
  id: string;
  content: string;
  color: string;
  date: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'create' | 'update' | 'delete' | 'bulk_import' | 'restore';
  policyName: string;
  details: string;
  operator: 'User' | 'AI System';
}

export interface SavedKey {
  name: string;
  key: string;
  addedAt: number;
}