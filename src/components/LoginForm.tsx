import React, { useState } from 'react';
import { LogIn, Eye, EyeOff, Loader2, UserPlus, Shield } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { login, register, type RegisterData } from '../services/auth';
import { useDeviceDetection } from '../utils/deviceDetection';

export default function LoginForm() {
  const { dispatch } = useApp();
  const device = useDeviceDetection();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  const [registerData, setRegisterData] = useState<RegisterData>({
    email: '',
    password: '',
    name: '',
    surname: '',
    company: '',
    sitePrefix: '',
    adminCode: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await login(loginData);

      if (result.success && result.user) {
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });
        console.log('Login successful:', result.user);
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await register(registerData);

      if (result.success && result.user) {
        setSuccessMessage('Registration successful! Logging you in...');
        setTimeout(() => {
          dispatch({ type: 'SET_AUTHENTICATED', payload: true });
        }, 1500);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const cardClass = `bg-white rounded-2xl shadow-2xl ${
    device.isMobile ? 'p-6' :
    device.isTablet ? 'p-7' :
    device.isTV ? 'p-12' :
    'p-8'
  }`;

  const inputClass = `w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
    device.isTV ? 'text-lg py-4' : ''
  }`;

  const buttonClass = `w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 ${
    device.isTV ? 'py-5 text-xl' : ''
  }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 flex items-center justify-center p-4">
      <div className={cardClass}>
        <div className="text-center mb-8">
          <div className={`${device.isTV ? 'w-24 h-24' : 'w-16 h-16'} bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4`}>
            {isRegisterMode ? (
              <UserPlus className={`${device.isTV ? 'w-12 h-12' : 'w-8 h-8'} text-white`} />
            ) : (
              <LogIn className={`${device.isTV ? 'w-12 h-12' : 'w-8 h-8'} text-white`} />
            )}
          </div>
          <h1 className={`${device.isTV ? 'text-4xl' : device.isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>
            4Property Codes
          </h1>
          <p className={`text-gray-600 ${device.isTV ? 'text-lg' : 'text-sm'}`}>
            {isRegisterMode ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        {isRegisterMode ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  className={inputClass}
                  placeholder="First name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Surname *
                </label>
                <input
                  type="text"
                  value={registerData.surname}
                  onChange={(e) => setRegisterData({ ...registerData, surname: e.target.value })}
                  className={inputClass}
                  placeholder="Last name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company
              </label>
              <input
                type="text"
                value={registerData.company}
                onChange={(e) => setRegisterData({ ...registerData, company: e.target.value })}
                className={inputClass}
                placeholder="Company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Prefix
              </label>
              <input
                type="text"
                value={registerData.sitePrefix}
                onChange={(e) => setRegisterData({ ...registerData, sitePrefix: e.target.value })}
                className={inputClass}
                placeholder="e.g., ADMIN"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                className={inputClass}
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  className={inputClass + ' pr-12'}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-amber-600" />
                <label className="block text-sm font-medium text-amber-900">
                  Admin Code (Optional)
                </label>
              </div>
              <input
                type="text"
                value={registerData.adminCode}
                onChange={(e) => setRegisterData({ ...registerData, adminCode: e.target.value })}
                className={inputClass}
                placeholder="Enter admin code if applicable"
              />
              <p className="text-xs text-amber-700 mt-2">
                Enter the admin verification code to create an admin account
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm">{successMessage}</p>
              </div>
            )}

            <button type="submit" disabled={isLoading} className={buttonClass}>
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Register
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setError('');
                setSuccessMessage('');
              }}
              className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Already have an account? Sign in
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                className={inputClass}
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className={inputClass + ' pr-12'}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <button type="submit" disabled={isLoading} className={buttonClass}>
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setError('');
              }}
              className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Don't have an account? Register
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
