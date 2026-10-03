import assert from "node:assert/strict";
import test from "node:test";
import { FeesInMemoryRepository } from "../packages/fees/src/in-memory-repository";
import { CashierInMemoryRepository } from "../packages/cashier/src/in-memory-repository";
import { CashierService } from "../packages/cashier/src/service";
import type { PaymentRecord } from "../packages/fees/src/model";

function payment(status: PaymentRecord["status"] = "RECORDED"): PaymentRecord {
  return {
    paymentId: "payment-1",
    schoolId: "school-1",
    studentId: "student-1",
    feeId: "fee-1",
    amount: 1200,
    paymentDate: "2026-10-03",
    receiptNumber: "RCP-001",
    recordedByUserId: "cashier-1",
    status,
    createdAt: "2026-10-03T00:00:00.000Z",
  };
}

test("cashier can view student payments and verify a recorded payment", async () => {
  const fees = new FeesInMemoryRepository();
  await fees.savePayment(payment());

  const cashierRepo = new CashierInMemoryRepository([payment()]);
  const service = new CashierService(cashierRepo, fees);

  const view = await service.findStudentPayments("school-1", "student-1", {
    canView: true,
    canVerify: true,
  });
  assert.equal(view.payments.length, 1);

  const verified = await service.verifyPayment("payment-1", "school-1", {
    canView: true,
    canVerify: true,
  });

  assert.equal(verified.status, "VERIFIED");
  assert.equal((await fees.getPayment("payment-1"))?.status, "VERIFIED");
});

test("cashier can reject a recorded payment", async () => {
  const fees = new FeesInMemoryRepository();
  await fees.savePayment(payment());

  const cashierRepo = new CashierInMemoryRepository([payment()]);
  const service = new CashierService(cashierRepo, fees);

  const rejected = await service.rejectPayment("payment-1", "school-1", {
    canView: true,
    canVerify: true,
  });

  assert.equal(rejected.status, "REJECTED");
  assert.equal((await fees.getPayment("payment-1"))?.status, "REJECTED");
});

test("cashier cannot verify without permission", async () => {
  const cashierRepo = new CashierInMemoryRepository([payment()]);
  const service = new CashierService(cashierRepo, new FeesInMemoryRepository());

  await assert.rejects(
    service.verifyPayment("payment-1", "school-1", { canView: true, canVerify: false }),
    /not permitted/,
  );
});
