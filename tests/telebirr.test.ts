import { test, describe } from 'node:test';
import assert from 'node:assert';
import { telebirrService } from '../apps/api/src/modules/payments/telebirr.service.js';

describe('Telebirr Cryptographic Payment Gateway', () => {
  test('Should deterministically sign payload in mock sandbox mode', () => {
    const payload = {
      appId: 'test_app_id',
      outTradeNo: 'BETOCH-TEST-001',
      totalAmount: '4500.00',
      timestamp: '1726830000'
    };

    const signature = telebirrService.signPayload(payload);
    assert.ok(signature, 'Signature must be generated');
    assert.strictEqual(typeof signature, 'string');
    assert.strictEqual(signature.length, 64, 'SHA-256 hex digest should be 64 characters');
  });

  test('Should verify matching signature and reject tampered callback payload', () => {
    const originalPayload = {
      appId: 'test_app_id',
      outTradeNo: 'BETOCH-TEST-002',
      totalAmount: '3500.00'
    };

    const validSignature = telebirrService.signPayload(originalPayload);
    const isVerified = telebirrService.verifySignature(originalPayload, validSignature);
    assert.strictEqual(isVerified, true, 'Valid signature should verify successfully');

    // Tampered payload
    const tamperedPayload = { ...originalPayload, totalAmount: '100.00' };
    const isTamperedVerified = telebirrService.verifySignature(tamperedPayload, validSignature);
    assert.strictEqual(isTamperedVerified, false, 'Tampered amount should fail signature verification');
  });
});
