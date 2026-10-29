export type VehicleStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'inactive' | 'maintenance' | 'suspended';

export type VehicleType = 'sedan' | 'suv' | 'hatchback' | 'mpv' | 'van' | 'minibus' | 'bus' | 'luxury' | 'electric';

export type DocumentType = 'rc' | 'insurance' | 'permit' | 'fitness' | 'pollution' | 'ownership' | 'other';

export type DocumentStatus = 'pending' | 'approved' | 'rejected';

export interface VehicleOwner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImage?: string;
  kycDocumentType?: string;
  kycDocumentNumber?: string;
  status?: string;
}

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  documentType: DocumentType;
  documentUrl: string;
  documentNumber?: string;
  expiryDate?: string;
  status: DocumentStatus;
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  ownerId: string;
  owner?: VehicleOwner;
  registrationNumber: string;
  brand: string;
  model: string;
  year: number;
  type: VehicleType;
  color: string;
  seatingCapacity: number;
  fuelType?: string;
  transmission?: string;
  vehicleImage?: string;
  rcNumber?: string;
  rcDocument?: string;
  insuranceNumber?: string;
  insuranceExpiry?: string;
  insuranceDocument?: string;
  permitNumber?: string;
  permitExpiry?: string;
  permitDocument?: string;
  fitnessCertificate?: string;
  fitnessExpiry?: string;
  status: VehicleStatus;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  suspendedBy?: string;
  suspendedAt?: string;
  suspensionReason?: string;
  hasAC: boolean;
  hasWifi: boolean;
  hasCharging: boolean;
  hasEntertainment: boolean;
  hasLuggageSpace: boolean;
  amenities?: Record<string, unknown>;
  basePrice: number;
  pricePerKm: number;
  isAvailable: boolean;
  fleetCompanyId?: string;
  fleetCompany?: { id: string; name: string };
  documents?: VehicleDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface VehicleApprovalHistory {
  id: string;
  userId?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: string;
  newValues?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface VehicleStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
}

export interface VehicleQueryParams {
  page?: number;
  limit?: number;
  status?: VehicleStatus;
  ownerId?: string;
  type?: VehicleType;
  search?: string;
}
