import React from 'react';

// Using `declare global` to augment the JSX namespace for custom elements.
// This ensures that our custom 'ion-icon' type is merged with React's
// built-in IntrinsicElements without causing module resolution issues.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'ion-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        name: string;
      };
    }
  }
}

export interface Trip {
  id: number;
  date: string;
  place: string;
  vendorName: string;
  customer: string;
  invoiceDCNumber: string;
  quarryName: string;
  royaltyOwnerName: string;
  material: string;
  vehicleNumber: string;
  transporterName:string;
  transportOwnerMobileNumber?: string;
  emptyWeight: number;
  grossWeight: number;
  netWeight: number;
  royaltyNumber: string;
  royaltyTons: number;
  royaltyM3: number;
  deductionPercentage: number;
  sizeChangePercentage: number;
  tonnage: number;
  revenue: number;
  materialCost: number;
  transportCost: number;
  royaltyCost: number;
  profit: number;
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  agent?: string;

  // New fields for supervisor workflow
  status: 'pending upload' | 'in transit' | 'pending validation' | 'completed';
  createdBy: string;
  ewayBillUpload?: string;
  invoiceDCUpload?: string;
  waymentSlipUpload?: string;
  royaltyUpload?: string;
  taxInvoiceUpload?: string;

  // New fields for received trips
  receivedDate?: string;
  endEmptyWeight?: number;
  endGrossWeight?: number;
  endNetWeight?: number;
  endWaymentSlipUpload?: string;
  weightDifferenceReason?: string;
}

export interface DailyExpense {
    id: string;
    date: string;
    from: string; // Supervisor name
    to: string; // Freeform text
    amount: number;
    remarks: string;
    availableBalance: number;
    closingBalance: number;
    type: 'DEBIT' | 'CREDIT'; // DEBIT = Expense, CREDIT = Top Up
}

export interface Advance {
  id: string;
  date: string;
  tripId?: number;
  fromAccount: string;
  toAccount: string;
  place?: string;
  invoiceDCNumber?: string;
  ownerAndTransporterName?: string;
  vehicleNumber?: string;
  purpose: string;
  amount: number;
  voucherSlipUpload?: string;
}

export interface Payment {
    id: number;
    tripId: number;
    amount: number;
    date: string;
    type: PaymentType;
}

export enum PaymentType {
    INCOME = 'income',
    EXPENSE = 'expense',
}

export enum Role {
    ADMIN = 'Admin',
    MANAGER = 'Manager',
    DRIVER = 'Driver',
    SUPERVISOR = 'Supervisor',
}

export interface User {
    id: number;
    name: string;
    role: Role;
    avatar: string;
    password?: string;
}

export interface Notification {
    id: number;
    message: string;
    type: 'alert' | 'info' | 'success';
    timestamp: string;
    read: boolean;
}

export interface DailySummary {
    totalTrips: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
}
export interface FinancialStatus {
    outstandingCustomer: number;
    outstandingTransporter: number;
    outstandingQuarry: number;
}
export interface ChartData {
    name: string;
    value: number;
}

// Updated based on request for more detailed ledger entries
export interface LedgerEntry {
    id: string;
    date: string;
    from: string;
    via: string;
    to: string;
    actualTo: string;
    amount: number;
    toBank: string;
    split: string;
    paymentSubType: string;
    paymentType: string;
    remarks: string;
    type: 'CREDIT' | 'DEBIT';
}

export interface RateEntry {
    id: string;
    fromSite: string;
    materialType: string;
    ratePerTon?: number;
    ratePerKm?: number;
    ratePerM3?: number;
    gst: 'inclusive' | 'exclusive' | '';
    gstPercentage: number;
    gstAmount: number;
    totalRate: number;
    effectiveFrom: string;
    effectiveTo: string;
    active: 'active' | 'not active';
    remarks: string;
}
export interface BaseOwner {
    id: string;
    contactNumber: string;
    address: string;
    openingBalance: number;
    rates: RateEntry[];
}
export interface VehicleOwner extends BaseOwner {
    ownerName: string;
    vehicleNumber: string;
    vehicleType: string;
    vehicleCapacity: number;
}
export interface QuarryOwner extends BaseOwner {
    ownerName: string;
    quarryName: string;
    quarryArea: number;
}
export interface RoyaltyOwner extends BaseOwner {
    ownerName: string;
    quarryArea: number;
}
export interface Customer extends BaseOwner {
    name: string;
}

export interface CustomerRate {
  id: number | string;
  customer: string;
  material: string;
  rate: string;
  from: string;
  to: string;
  active: boolean;
  rejectionPercent: string;
  rejectionRemarks: string;
  locationFrom: string;
  locationTo: string;
}

export interface Material {
    id: number;
    name: string;
    costPerTon: string;
    costPerCubicMeter: string;
}

export interface RoyaltyStock {
    id: string;
    purchaseDate: string;
    quantity: number;
    cost: number;
}

export interface Account {
    id: string;
    name: string;
    categoryId: string;
    categoryName: string;
}

export interface AccountCategory {
    id: string;
    name: string;
}