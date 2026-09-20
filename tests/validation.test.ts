import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  registerSchema,
  createPropertyStep3Schema,
  submitRentalApplicationSchema
} from '@betoch/validation';
import { UserRole } from '@betoch/shared';

describe('Validation Schemas & Ethiopian Constraints', () => {
  test('Should accept valid Ethiopian phone numbers (+251 9... and 09...)', () => {
    const validRegistration = {
      email: 'tenant@example.com',
      phone: '0911223344',
      password: 'StrongPassword1!',
      role: UserRole.RENTER,
      firstName: 'Almaz',
      lastName: 'Tesfaye'
    };

    const result = registerSchema.safeParse(validRegistration);
    assert.strictEqual(result.success, true);
    if (result.success) {
      assert.strictEqual(result.data.phone, '+251911223344');
    }
  });

  test('Should reject invalid passwords lacking numbers or uppercase letters', () => {
    const weakPasswordReg = {
      email: 'tenant2@example.com',
      phone: '+251911000002',
      password: 'weakpassword',
      role: UserRole.RENTER,
      firstName: 'Abebe',
      lastName: 'Bikila'
    };

    const result = registerSchema.safeParse(weakPasswordReg);
    assert.strictEqual(result.success, false);
  });

  test('Should reject rental listing deposits exceeding 2 months rent under Proclamation 1320', () => {
    const excessiveDepositListing = {
      monthlyRent: 40000,
      depositAmount: 120000, // 3 months rent -> Illegal!
      leaseDurationMonths: 12,
      availableFrom: '2026-10-01',
      utilitiesIncluded: ['Water']
    };

    const result = createPropertyStep3Schema.safeParse(excessiveDepositListing);
    assert.strictEqual(result.success, false, 'Deposit exceeding 2 months must fail validation');
  });

  test('Should accept rental listing deposit within 2 months rent', () => {
    const validDepositListing = {
      monthlyRent: 40000,
      depositAmount: 80000, // Exactly 2 months rent -> Legal
      leaseDurationMonths: 12,
      availableFrom: '2026-10-01',
      utilitiesIncluded: ['Water']
    };

    const result = createPropertyStep3Schema.safeParse(validDepositListing);
    assert.strictEqual(result.success, true, 'Deposit within 2 months must pass validation');
  });

  test('Should validate rental application structure', () => {
    const validApp = {
      propertyId: '123e4567-e89b-12d3-a456-426614174000',
      proposedStartDate: '2026-10-01',
      occupantsCount: 2,
      message: 'Hello, I am a professional moving to Bole Atlas and would like to lease your home.'
    };

    const result = submitRentalApplicationSchema.safeParse(validApp);
    assert.strictEqual(result.success, true);
  });
});
