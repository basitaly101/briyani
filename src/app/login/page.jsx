'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/app/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { showToast, showAuthSuccess } from '../utils/alert';
import './login.css';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  // Role Mapping: patient (default), doctor, receptionist, admin
  const [role, setRole] = useState('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const ROLE_REDIRECTS = {
    admin: '/admin/dashboard',
    doctor: '/doctor/dashboard',
    receptionist: '/receptionist/dashboard',
    patient: '/patient/dashboard',
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      
      const userDoc = await getDoc(doc(db, 'users', res.user.uid));

      if (!userDoc.exists()) {
        showToast('error', 'No Record', 'Healthcare profile not found.');
        setLoading(false);
        return;
      }

      const userData = userDoc.data();

      // Role Mismatch Check
      if (userData.role !== role) {
        showToast('error', 'Access Denied', `This account is registered as ${userData.role.toUpperCase()}. Please select the correct portal.`);
        setLoading(false);
        return;
      }

      // Staff Approval Check
      const isStaff = ['doctor', 'receptionist'].includes(userData.role);
      if (isStaff && userData.approved === false) {
        showToast('warning', 'Access Pending', 'Your staff account is awaiting administrator activation.');
        setLoading(false);
        return;
      }

      // Success Flow
      document.cookie = `clinic_role=${userData.role};path=/;max-age=86400;samesite=lax`;
      await showAuthSuccess(userData.role);

      const targetPath = redirectPath || ROLE_REDIRECTS[userData.role];
      router.push(targetPath);

    } catch (err) {
      let message = "Invalid credentials.";
      if (err.code === 'auth/user-not-found') message = "Email not registered.";
      if (err.code === 'auth/wrong-password') message = "Incorrect password.";
      showToast('error', 'Authentication Failed', message);
      setLoading(false);
    }
  };

  return (
    <div className="login-viewport">
      <motion.div
        className="premium-card"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="visual-section">
          <div className="brand-logo-text">
            <span className="plus-icon">+</span> Clinic<span>Manager</span>
          </div>
          <div className="quote-box">
            <h1 className="quote-text">
              Precision <span className="quote-highlight">Healthcare</span> Management.
            </h1>
            <p className="quote-subtext">Secure prescriptions, smart appointments, and seamless patient care.</p>
          </div>
        </div>

        <div className="form-section">
          <div className="form-header">
            <h2>Welcome Back</h2>
            <p>Please select your portal to sign in</p>
          </div>

          <div className="role-pills">
            {['patient', 'doctor', 'receptionist', 'admin'].map((r) => (
              <button
                key={r}
                type="button"
                className={role === r ? 'active' : ''}
                onClick={() => setRole(r)}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            <div className="input-grp">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="doctor@clinic.com or patient@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-grp">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <a href="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>
                  Forgot Password?
                </a>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? <span className="loader-text">Verifying...</span> : `Login to ${role.charAt(0).toUpperCase() + role.slice(1)} Portal`}
            </button>
          </form>

          {(role === 'patient' || role === 'admin') && (
            <p className="signup-link">
              New to our clinic? <a href={`/signup?role=${role}`}>Create {role.toUpperCase()} account</a>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="login-viewport">Loading Clinic Portal...</div>}>
      <LoginForm />
    </Suspense>
  );
}