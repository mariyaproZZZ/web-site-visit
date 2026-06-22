// src/utils/auth.ts

// Тип для пользователя
interface User {
  login: string;
  role: 'student' | 'teacher';
}

// Сохранение данных пользователя
export const setAuth = (user: User): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

// Получение данных пользователя
export const getAuth = (): User | null => {
  const user = localStorage.getItem('user');
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};

// Выход из системы (удаление данных)
export const logout = (): void => {
  localStorage.removeItem('user');
};

// Проверка авторизации
export const isAuthenticated = (): boolean => {
  return localStorage.getItem('user') !== null;
};

// Получение роли пользователя
export const getUserRole = (): 'student' | 'teacher' | null => {
  const user = getAuth();
  return user ? user.role : null;
};