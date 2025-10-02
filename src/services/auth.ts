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

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      return { success: false, error: 'User with this email already exists' };
    }

    const isAdmin = adminCode === ADMIN_CODE;

    const passwordHash = await hashPassword(password);

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name,
        surname,
        company: company || '',
        site_prefix: sitePrefix || '',
        is_admin: isAdmin,
        is_verified: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Registration error:', insertError);
      return { success: false, error: 'Failed to create user account' };
    }

    const user: User = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      surname: newUser.surname,
      company: newUser.company,
      sitePrefix: newUser.site_prefix,
      isAdmin: newUser.is_admin,
      isVerified: newUser.is_verified,
      createdAt: newUser.created_at,
    };

    localStorage.setItem('4property_user', JSON.stringify(user));
    localStorage.setItem('4property_auth_token', newUser.id);

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

    const passwordHash = await hashPassword(password);

    const { data: user, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('password_hash', passwordHash)
      .maybeSingle();

    if (queryError || !user) {
      return { success: false, error: 'Invalid email or password' };
    }

    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    const userData: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      surname: user.surname,
      company: user.company,
      sitePrefix: user.site_prefix,
      isAdmin: user.is_admin,
      isVerified: user.is_verified,
      createdAt: user.created_at,
      lastLogin: new Date().toISOString(),
    };

    localStorage.setItem('4property_user', JSON.stringify(userData));
    localStorage.setItem('4property_auth_token', user.id);

    return { success: true, user: userData };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export function logout(): void {
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
