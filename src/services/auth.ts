import { supabase } from './supabase';

const ADMIN_CODE = '894805889';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  surname: string;
  company: string;
  sitePrefix: string;
  adminCode?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  surname: string;
  company: string;
  sitePrefix: string;
  isAdmin: boolean;
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

export async function register(data: RegisterData): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const { email, password, name, surname, company, sitePrefix, adminCode } = data;

    if (!email || !password || !name || !surname) {
      return { success: false, error: 'All required fields must be filled' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Invalid email format' };
    }

    const isAdmin = adminCode === ADMIN_CODE;

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        data: {
          name,
          surname,
          company: company || '',
          site_prefix: sitePrefix || '',
          is_admin: isAdmin,
        },
      },
    });

    if (signUpError) {
      console.error('Registration error:', signUpError);
      if (signUpError.message.includes('already registered')) {
        return { success: false, error: 'User with this email already exists' };
      }
      return { success: false, error: signUpError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'Failed to create user account' };
    }

    const user: User = {
      id: authData.user.id,
      email: authData.user.email!,
      name,
      surname,
      company: company || '',
      sitePrefix: sitePrefix || '',
      isAdmin,
      isVerified: true,
      createdAt: authData.user.created_at,
    };

    localStorage.setItem('4property_user', JSON.stringify(user));
    localStorage.setItem('4property_auth_token', authData.user.id);

    return { success: true, user };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function login(data: LoginData): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const { email, password } = data;

    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });

    if (signInError || !authData.user) {
      return { success: false, error: 'Invalid email or password' };
    }

    const userData: User = {
      id: authData.user.id,
      email: authData.user.email!,
      name: authData.user.user_metadata.name || '',
      surname: authData.user.user_metadata.surname || '',
      company: authData.user.user_metadata.company || '',
      sitePrefix: authData.user.user_metadata.site_prefix || '',
      isAdmin: authData.user.user_metadata.is_admin || false,
      isVerified: true,
      createdAt: authData.user.created_at,
      lastLogin: new Date().toISOString(),
    };

    localStorage.setItem('4property_user', JSON.stringify(userData));
    localStorage.setItem('4property_auth_token', authData.user.id);

    return { success: true, user: userData };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
  localStorage.removeItem('4property_user');
  localStorage.removeItem('4property_auth_token');
}

export function getCurrentUser(): User | null {
  try {
    const userStr = localStorage.getItem('4property_user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('4property_auth_token');
}

export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.isAdmin || false;
}
