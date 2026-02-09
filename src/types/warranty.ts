export interface WarrantyClaimDto {
  id: string;
  claimNumber: string;
  claimType: 'warranty-inspection' | 'service-repair' | 'firstup-failure';
  proofOfPurchasePath: string;
  proofOfPurchaseFileName: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  address: string;
  modelNumber: string;
  serialNumber: string;
  faultDescription: string;
  proofMethod?: string; 
  invoiceNumber?: string;
  status: 'submitted' | 'picked_up' | 'Sent' | 'rejected' | 'completed';
  statusNotes: string;
  assignedTo: string;
  createdAt: string;
  updatedAt?: string;
  submittedAt: string;
  reviewedAt?: string;
  completedAt?: string;
  isActive: boolean;
  faultImages: WarrantyClaimImageDto[];
   products?: ProductClaimDto[];
  commonFaultDescription?: string;
}

export interface WarrantyClaimImageDto {
  id: string;
  warrantyClaimId: string;
  imageUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  displayOrder: number;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
}

export interface ProductClaimDto {
  id: string;
  warrantyClaimId: string;
  modelNumber: string;
  serialNumber?: string;
  faultDescription: string;
  displayOrder: number;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
}

export interface CreateWarrantyClaimDto {
  claimType: 'warranty-inspection' | 'service-repair' | 'firstup-failure';
  fullName: string;
  phoneNumber: string;
  email: string;
  address: string;
  modelNumber: string;
  serialNumber: string;
  faultDescription: string;
}

export interface UpdateWarrantyClaimStatusDto {
  status: 'submitted' | 'picked_up' | 'Sent' | 'rejected' | 'completed';
  statusNotes: string;
  assignedTo: string;
}

export interface WarrantyDashboardStats {
  totalClaims: number;
  submittedCount: number;
  underReviewCount: number;
  SentCount: number;
  rejectedCount: number;
  completedCount: number;
  monthlyStats: MonthlyClaimCount[];
}

export interface MonthlyClaimCount {
  year: number;
  month: number;
  count: number;
  monthName: string;
}