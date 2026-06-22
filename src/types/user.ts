export type UserRole = 'student' | 'teacher';

/** Данные пользователя после входа (без пароля) */
export interface User {
  id: string;
  login: string;
  fullName: string;
  role: UserRole;
  groupId?: number;
}

/** Запись преподавателя в db.json */
export interface DbTeacher {
  id: string;
  login: string;
  password: string;
  fullName: string;
}

/** Запись студента в db.json */
export interface DbStudent {
  id: string;
  login: string;
  password: string;
  fullName: string;
  groupId: number;
}