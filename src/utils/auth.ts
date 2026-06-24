// utils/auth.ts

interface User {
  id: string;
  login: string;
  fullName: string;
  role: 'student' | 'teacher';
  groupId?: number;
}

// Генерируем уникальный ID для вкладки при первом вызове
const getTabId = (): string => {
  let tabId = sessionStorage.getItem('tab_id');
  if (!tabId) {
    tabId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('tab_id', tabId);
  }
  return tabId;
};

// Формируем уникальные ключи для каждой вкладки
const TAB_ID = getTabId();
const USER_KEY = `user_${TAB_ID}`;
const TOKEN_KEY = `token_${TAB_ID}`;
const ACTIVE_TAB_KEY = 'active_tab_id';

export const setAuth = (user: User, token: string) => {
  // Сохраняем данные в localStorage с уникальным ключом
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, token);
  // Запоминаем, какая вкладка сейчас активна
  localStorage.setItem(ACTIVE_TAB_KEY, TAB_ID);
  // Также сохраняем в sessionStorage для быстрого доступа в текущей вкладке
  sessionStorage.setItem('current_user', JSON.stringify(user));
  sessionStorage.setItem('current_token', token);
};

export const getUser = (): User | null => {
  // Сначала проверяем sessionStorage (текущая вкладка)
  const currentUser = sessionStorage.getItem('current_user');
  if (currentUser) {
    try {
      return JSON.parse(currentUser);
    } catch {
      // Если ошибка, продолжаем
    }
  }
  
  // Если в sessionStorage нет, ищем в localStorage по активной вкладке
  const activeTabId = localStorage.getItem(ACTIVE_TAB_KEY);
  if (!activeTabId) return null;
  
  const data = localStorage.getItem(`user_${activeTabId}`);
  if (!data) return null;
  
  try {
    return JSON.parse(data) as User;
  } catch {
    return null;
  }
};

export const getToken = (): string | null => {
  // Сначала проверяем sessionStorage
  const currentToken = sessionStorage.getItem('current_token');
  if (currentToken) return currentToken;
  
  // Затем localStorage
  const activeTabId = localStorage.getItem(ACTIVE_TAB_KEY);
  if (!activeTabId) return null;
  
  return localStorage.getItem(`token_${activeTabId}`);
};

export const getUserRole = (): 'student' | 'teacher' | null => {
  const user = getUser();
  return user ? user.role : null;
};

export const isAuthenticated = (): boolean => {
  return !!getUser() && !!getToken();
};

export const logout = () => {
  // Удаляем данные из sessionStorage
  sessionStorage.removeItem('current_user');
  sessionStorage.removeItem('current_token');
  sessionStorage.removeItem('tab_id');
  
  // Удаляем данные из localStorage
  const activeTabId = localStorage.getItem(ACTIVE_TAB_KEY);
  if (activeTabId) {
    localStorage.removeItem(`user_${activeTabId}`);
    localStorage.removeItem(`token_${activeTabId}`);
  }
  localStorage.removeItem(ACTIVE_TAB_KEY);
};

export type { User };