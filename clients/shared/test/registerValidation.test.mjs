import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  toCustomerRegisterRequest,
  validateRegisterForm
} from '../src/auth/registerValidation.ts';
import { USER_ROLE } from '../src/userRoles.ts';

describe('registerValidation', () => {
  const valid = {
    firstName: 'Ayşe',
    lastName: 'Yılmaz',
    email: 'ayse@example.com',
    password: 'TestPwd!1',
    confirmPassword: 'TestPwd!1'
  };

  it('accepts valid customer signup input', () => {
    assert.deepEqual(validateRegisterForm(valid), { ok: true });
  });

  it('rejects mismatched passwords', () => {
    const result = validateRegisterForm({ ...valid, confirmPassword: 'other' });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.message, /eşleşmiyor/i);
    }
  });

  it('builds register request with Customer role', () => {
    const payload = toCustomerRegisterRequest(valid);
    assert.equal(payload.role, USER_ROLE.Customer);
    assert.equal(payload.email, 'ayse@example.com');
  });
});
