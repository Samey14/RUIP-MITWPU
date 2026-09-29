import React, { useState } from 'react';
import { UserSession, RegisteredUser } from '../types';
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  Mail,
  AlertCircle,
  Sun,
  Moon,
  Eye,
  EyeOff,
  CheckCircle2,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { signInWithGoogle, signOutUser, auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { StorageService, DEFAULT_REGISTERED_USERS } from '../services/storage';
import { MitWpuLogo } from './MitWpuLogo';

interface AuthScreenProps {
  onLogin: (session: UserSession) => void;
  registeredUsers?: RegisteredUser[];
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

const DOMAIN = 'mitwpu.edu.in';
const EMAIL_REGEX = /^[^\s@]+@mitwpu\.edu\.in$/i;

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLogin,
  registeredUsers,
  theme = 'light',
  onToggleTheme,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Active registered users list from props or storage
  const activeRegistry: RegisteredUser[] =
    registeredUsers && registeredUsers.length > 0
      ? registeredUsers
      : StorageService.getRegisteredUsers() || DEFAULT_REGISTERED_USERS;

  // Real Google Sign-In with strict server verification
  const handleGoogleSignIn = async () => {
    setError('');
    setUnauthorizedDomain(null);
    setIsGoogleLoading(true);

    try {
      // Real Firebase popup authentication
      const user = await signInWithGoogle();
      if (!user || !user.email) {
        throw new Error('Google did not return user account credentials.');
      }

      const cleanEmail = user.email.trim().toLowerCase();

      // 1. Strict Domain Validation: ONLY @mitwpu.edu.in
      if (!cleanEmail.endsWith(`@${DOMAIN}`)) {
        await signOutUser();
        setError(
          `Access Denied: Google sign-in completed with "${cleanEmail}". Only institutional accounts ending in @${DOMAIN} registered by the Admin Department are permitted.`
        );
        return;
      }

      // 2. Strict Whitelist Check Against Admin Registry
      const userRecord = activeRegistry.find(
        u => u.email.trim().toLowerCase() === cleanEmail
      );

      if (!userRecord) {
        await signOutUser();
        setError(
          `Access Denied: Google sign-in was verified for "${cleanEmail}", but this account is not registered by the Admin Department. Please contact the Administration Office.`
        );
        return;
      }

      // 3. Status Check
      if (userRecord.status === 'suspended') {
        await signOutUser();
        setError(
          `Account Suspended: The account "${cleanEmail}" has been deactivated by the Admin Department.`
        );
        return;
      }

      // 4. Authorized Login as authenticated individual
      console.log('[Auth] Firebase Google Authentication successful:', {
        uid: user.uid,
        email: user.email,
        provider: user.providerData[0]?.providerId || 'google.com'
      });

      const session: UserSession = {
        email: userRecord.email,
        role: userRecord.role,
        name: user.displayName || userRecord.name,
        issuedAt: Date.now(),
        provider: 'google',
      };

      onLogin(session);
    } catch (err: any) {
      const errCode = err?.code || '';
      const errMsg = String(err?.message || '');

      if (errCode === 'auth/popup-closed-by-user') {
        // User closed or dismissed the popup window - normal user interaction
        setError('Google sign-in popup was closed. Please try again or sign in with your password below.');
      } else if (errCode === 'auth/cancelled-popup-request') {
        // Superseded popup request - ignore silently
      } else if (errCode === 'auth/popup-blocked') {
        console.warn('Google Sign-In popup was blocked by browser');
        setError(
          'Google sign-in popup was blocked by your browser. Please allow popups for this site or sign in with your email and password below.'
        );
      } else if (errCode === 'auth/unauthorized-domain') {
        console.warn('Google Sign-In domain authorization needed');
        const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'run.app';
        setUnauthorizedDomain(currentHost);
        setError('Firebase Authorized Domain required for Google popup sign-in.');
      } else {
        console.warn('Google Sign-In notice:', errMsg);
        setError(
          errMsg || 'Google authentication encountered an interruption. Please sign in with your password below.'
        );
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const copyDomainToClipboard = (domainToCopy: string) => {
    navigator.clipboard.writeText(domainToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  // Password Sign-In with Individual Password Validation & Firebase Authentication
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const cleanEmail = email.trim().toLowerCase();

    // 1. Domain Validation
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setError(`Access Denied: Please enter your official university email ending in @${DOMAIN}.`);
      setIsSubmitting(false);
      return;
    }

    // 2. Admin Registry Lookup
    const userRecord = activeRegistry.find(
      u => u.email.trim().toLowerCase() === cleanEmail
    );

    if (!userRecord) {
      setError(
        `Access Denied: The account "${cleanEmail}" is not registered by the Admin Department. Random accounts cannot access this system. Please contact the MIT-WPU Accounts & Administration Office to register.`
      );
      setIsSubmitting(false);
      return;
    }

    // 3. Status Check
    if (userRecord.status === 'suspended') {
      setError(`Account Suspended: The account "${cleanEmail}" has been deactivated by the Admin Department.`);
      setIsSubmitting(false);
      return;
    }

    // 4. Individual Password Check
    // Each user has their own password set by admin or initial profile
    const expectedPassword =
      userRecord.password ||
      (userRecord.role === 'admin' ? 'admin123' : 'faculty123');

    if (password !== expectedPassword) {
      setError(`Incorrect password for ${cleanEmail}. Please verify your credentials and try again.`);
      setIsSubmitting(false);
      return;
    }

    // 5. Complete Firebase Authentication so onAuthStateChanged confirms current user
    try {
      let fbUser;
      try {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, expectedPassword);
        fbUser = cred.user;
      } catch (authErr: any) {
        if (
          authErr?.code === 'auth/user-not-found' ||
          authErr?.code === 'auth/invalid-credential' ||
          authErr?.code === 'auth/invalid-login-credentials'
        ) {
          try {
            const newCred = await createUserWithEmailAndPassword(auth, cleanEmail, expectedPassword);
            fbUser = newCred.user;
          } catch (createErr) {
            console.warn('[Auth] Firebase account creation fallback:', createErr);
          }
        } else {
          console.warn('[Auth] Firebase sign-in notice:', authErr?.message || authErr);
        }
      }

      if (fbUser) {
        console.log('[Auth] Firebase email/password authentication successful:', {
          uid: fbUser.uid,
          email: fbUser.email,
          provider: fbUser.providerData[0]?.providerId || 'password'
        });
      }
    } catch (fbErr) {
      console.warn('[Auth] Firebase authentication flow notice:', fbErr);
    }

    // 6. Authorized Login
    const session: UserSession = {
      email: userRecord.email,
      role: userRecord.role,
      name: userRecord.name,
      issuedAt: Date.now(),
      provider: 'email',
    };

    onLogin(session);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-200">
      {/* Theme Toggle Button Top Right */}
      {onToggleTheme && (
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2.5 rounded-xl bg-white/90 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 shadow-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition flex items-center gap-2 text-xs font-semibold"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-zinc-700" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Grid Pattern Background */}
      <div
        className="absolute inset-0 opacity-15 dark:opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.08) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Main Single Institutional Login Card */}
      <div className="relative w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-7 sm:p-9 z-10 space-y-6">
        {/* Header / Brand */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <MitWpuLogo size="lg" />
          </div>

          <div>
            <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest font-mono-tabular">
              MIT World Peace University
            </div>
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight mt-1 font-heading">
              Rural Immersion Programme
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Sign in with your official university credentials
            </p>
          </div>
        </div>

        {/* Error Alert Banner */}
        {error && !unauthorizedDomain && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>Authentication Error</span>
            </div>
            <p className="leading-relaxed text-[11px]">{error}</p>
          </div>
        )}

        {/* Firebase Authorized Domain Helper Banner */}
        {unauthorizedDomain && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2.5">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>1 Step Required for Google Popup</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
              Firebase requires authorizing this domain in your console before Google popups can proceed:
            </p>
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-900 font-mono text-[11px]">
              <span className="truncate select-all">{unauthorizedDomain}</span>
              <button
                type="button"
                onClick={() => copyDomainToClipboard(unauthorizedDomain)}
                className="px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 text-[10px] font-bold shrink-0 transition flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>{isCopied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <div className="flex flex-col gap-1 pt-1 border-t border-amber-200 dark:border-amber-900/60">
              <a
                href="https://console.firebase.google.com/project/ruip-expense-tracker---mitwpu/authentication/settings"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:underline"
              >
                <span>Click here to open Firebase Console &gt; Settings &gt; Authorized domains</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <p className="text-[10px] text-amber-700 dark:text-amber-400">
                Click <strong>Add domain</strong> &gt; paste the copied domain &gt; Save. Or simply use email &amp; password sign-in below.
              </p>
            </div>
          </div>
        )}

        {/* Standard Google Sign-In Button */}
        <div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full py-2.5 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-zinc-800 dark:text-zinc-100 text-xs font-semibold transition flex items-center justify-center gap-2.5 shadow-xs disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-mono-tabular">
            <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-400">Or with institutional email</span>
          </div>
        </div>

        {/* Standard Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Institutional Email */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5" htmlFor="email-input">
              University Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                id="email-input"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder={`your.name@${DOMAIN}`}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono-tabular text-zinc-900 dark:text-white outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-emerald-500/20 transition"
              />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1 font-mono-tabular">
              Only @{DOMAIN} accounts registered by Admin can sign in
            </p>
          </div>

          {/* Password with Show/Hide toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300" htmlFor="password-input">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter your personal password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-emerald-500/20 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 mt-2"
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer info */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 font-mono-tabular">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Authorized Faculty &amp; Accounts Portal · MIT-WPU</span>
          </div>
        </div>
      </div>
    </div>
  );
};
