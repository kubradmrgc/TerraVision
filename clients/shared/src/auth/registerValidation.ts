import { USER_ROLE } from '../userRoles';
import type { RegisterRequest } from '../types/auth';

export type RegisterFormInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type RegisterValidationResult = { ok: true } | { ok: false; message: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function validateRegisterForm(input: RegisterFormInput): RegisterValidationResult {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim();

  if (!firstName) {
    return { ok: false, message: 'Ad alanı zorunludur.' };
  }
  if (!lastName) {
    return { ok: false, message: 'Soyad alanı zorunludur.' };
  }
  if (!email) {
    return { ok: false, message: 'E-posta alanı zorunludur.' };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, message: 'Geçerli bir e-posta adresi girin.' };
  }
  if (!input.password) {
    return { ok: false, message: 'Şifre alanı zorunludur.' };
  }
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, message: `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır.` };
  }
  if (input.password !== input.confirmPassword) {
    return { ok: false, message: 'Şifreler eşleşmiyor.' };
  }

  return { ok: true };
}

/** Builds the API payload for customer self-registration (web + mobile). */
export function toCustomerRegisterRequest(input: RegisterFormInput): RegisterRequest {
  return {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.trim(),
    password: input.password,
    role: USER_ROLE.Customer
  };
}
