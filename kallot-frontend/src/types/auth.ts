
export type Role = 'GRADUATE' | 'REP' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'PENDING' | 'BLOCKED';
export type BlessingEmailPref = 'EACH' | 'DAILY' | 'NONE';

export interface User {
  id: string;
  classId: string | null; 
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  blessingEmailPref: BlessingEmailPref;
  reminderEmails: boolean;
  announcementEmails: boolean;
  createdAt: string;
}

export interface MeUser extends User {
  className: string | null; 
  yearbook: {
    id: string;
    name: string;
    hebrewYear: string; 
  };
  kallaId: string | null;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface RegisterBody {
  joinCode: string;
  classId: string;
  name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterResponse extends LoginResponse {
  message: string;
}
