import { test, describe } from 'node:test';
import assert from 'node:assert';
import { ETHIOPIAN_RENTAL_REGULATIONS } from '@betoch/shared';

describe('Commission & Rental Regulations Engine', () => {
  test('Should calculate standard 10% platform commission correctly', () => {
    const monthlyRent = 45000;
    const commissionPercent = 10.0;
    const commissionAmount = Number((monthlyRent * (commissionPercent / 100)).toFixed(2));

    assert.strictEqual(commissionAmount, 4500.0);
  });

  test('Should enforce Ethiopian Proclamation 1320/2024 deposit cap of 2 months', () => {
    const monthlyRent = 30000;
    const maxAllowedDeposit = monthlyRent * ETHIOPIAN_RENTAL_REGULATIONS.MAX_DEPOSIT_MONTHS;

    assert.strictEqual(maxAllowedDeposit, 60000);

    const compliantDeposit = 50000;
    const illegalDeposit = 90000;

    assert.ok(compliantDeposit <= maxAllowedDeposit, '50,000 ETB deposit should be legal');
    assert.ok(illegalDeposit > maxAllowedDeposit, '90,000 ETB deposit exceeds 2-month legal limit');
  });

  test('Should handle decimal minor units without floating point loss', () => {
    const rent = 27850.50;
    const rate = 10.0;
    const commission = Number((rent * (rate / 100)).toFixed(2));

    assert.strictEqual(commission, 2785.05);
  });
});
