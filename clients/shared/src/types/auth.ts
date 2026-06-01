export interface LoginRequest {
  email: string;
  password: string;
}

/** POST /api/auth/register — role must be Customer for self-service signup. */
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: number;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  accessTokenExpiresAtUtc: string;
  refreshTokenExpiresAtUtc: string;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: number;
}
