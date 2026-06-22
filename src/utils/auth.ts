import type { User, UserRole } from '../types/user';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export type { User, UserRole };

export const setAuth = (user: User, token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const getUser = (): User | null => {
  const data = localStorage.getItem(USER_KEY);
  if (!data) {
    return null;
  }
  try {
    return JSON.parse(data) as User;
  } catch {
    return null;
  }
};

export const getUserRole = (): UserRole | null => getUser()?.role ?? null;

export const isAuthenticated = (): boolean => getToken() !== null;

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};