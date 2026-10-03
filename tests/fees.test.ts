import assert from "node:assert/strict";
import test from "node:test";
import { FeesInMemoryRepository } from "../packages/fees/src/in-memory-repository";
import { FeesService } from "../packages/fees/src/service";

const manage = { canManage: true, canView: true, canRecordPayment: true };

test("creates a school fee and calculates offline student balance", async () => {
  const repository = new FeesInMemoryRepository();
  const service = new FeesService(repository);

  await service.createFee({
    feeId: "fee-1",
    schoolId: "school-1",
    name: "First Term School Fees",
    amount: 2000,
    sessionId: "session-1",
    termId: "term-1",
    scope: "SCHOOL",
    status: "ACTIVE",
    createdAt: "2026-10-03T00:00:00.000Z",
  }, manage);

  await service.assignFeeToStudent("fee-1", "student-1", "school-1", manage, "2026-10-03T00:00:00.000Z");
  await service.recordPayment({
    paymentId: "payment-1",
    schoolId: "school-1",
    studentId: "student-1",
    feeId: "fee-1",
    amount: 1200,
    paymentDate: "2026-10-03",
    receiptNumber: "RCP-001",
    recordedByUserId: "cashier-1",
    status: "RECORDED",
    createdAt: "2026-10-03T00:00:00.000Z",
  }, manage);

  assert.deepEqual(
    await service.getStudentBalance("school-1", "student-1", "fee-1", manage),
    { studentId: "student-1", feeId: "fee-1", feeAmount: 2000, paidAmount: 1200, balance: 800 },
  );
});

test("allows partial payment", async () => {
  const repository = new FeesInMemoryRepository();
  const service = new FeesService(repository);

  await service.createFee({
    feeId: "fee-1",
    schoolId: "school-1",
    name: "Test Fee",
    amount: 5000,
    sessionId: "session-1",
    termId: "term-1",
    scope: "SCHOOL",
    status: "ACTIVE",
    createdAt: "2026-10-03T00:00:00.000Z",
  }, manage);
  await service.assignFeeToStudent("fee-1", "student-1", "school-1", manage, "2026-10-03T00:00:00.000Z");

  await service.recordPayment({
    paymentId: "payment-1",
    schoolId: "school-1",
    studentId: "student-1",
    feeId: "fee-1",
    amount: 2000,
    paymentDate: "2026-10-03",
    recordedByUserId: "cashier-1",
    status: "RECORDED",
    createdAt: "2026-10-03T00:00:00.000Z",
  }, manage);
  await service.recordPayment({
    paymentId: "payment-2",
    schoolId: "school-1",
    studentId: "student-1",
    feeId: "fee-1",
    amount: 1500,
    paymentDate: "2026-10-04",
    recordedByUserId: "cashier-1",
    status: "RECORDED",
    createdAt: "2026-10-04T00:00:00.000Z",
  }, manage);

  const balance = await service.getStudentBalance("school-1", "student-1", "fee-1", manage);
  assert.equal(balance.paidAmount, 3500);
  assert.equal(balance.balance, 1500);
});

test("does not allow recording payment for an unassigned fee", async () => {
  const service = new FeesService(new FeesInMemoryRepository());
  await assert.rejects(
    service.recordPayment({
      paymentId: "payment-1",
      schoolId: "school-1",
      studentId: "student-1",
      feeId: "fee-1",
      amount: 1000,
      paymentDate: "2026-10-03",
      recordedByUserId: "cashier-1",
      status: "RECORDED",
      createdAt: "2026-10-03T00:00:00.000Z",
    }, manage),
    /Fee not found/,
  );
});

test("requires management permission for fee setup", async () => {
  const service = new FeesService(new FeesInMemoryRepository());
  await assert.rejects(
    service.createFee({
      feeId: "fee-1",
      schoolId: "school-1",
      name: "School Fee",
      amount: 2000,
      sessionId: "session-1",
      termId: "term-1",
      scope: "SCHOOL",
      status: "ACTIVE",
      createdAt: "2026-10-03T00:00:00.000Z",
    }, { canManage: false, canView: true, canRecordPayment: true }),
    /not permitted/,
  );
});
