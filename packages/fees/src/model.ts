export type FeeScope = "SCHOOL" | "CLASS";

export interface Fee {
  feeId: string;
  schoolId: string;
  name: string;
  amount: number;
  sessionId: string;
  termId: string;
  scope: FeeScope;
  classId?: string;
  status: "ACTIVE" | "DISABLED";
  createdAt: string;
}

export interface StudentFee {
  studentFeeId: string;
  feeId: string;
  schoolId: string;
  studentId: string;
  amount: number;
  createdAt: string;
}

export interface PaymentRecord {
  paymentId: string;
  schoolId: string;
  studentId: string;
  feeId: string;
  amount: number;
  paymentDate: string;
  receiptNumber?: string;
  recordedByUserId: string;
  status: "RECORDED" | "VERIFIED" | "REJECTED";
  createdAt: string;
}

export interface StudentBalance {
  studentId: string;
  feeId: string;
  feeAmount: number;
  paidAmount: number;
  balance: number;
}
