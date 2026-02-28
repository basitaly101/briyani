'use client';

import { useState } from 'react';
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { motion } from 'framer-motion';
import { showToast } from '../utils/alert';
import './forget-password.css';

export default function ForgotPassword() {
  const [role, setRole] = useState('patient');
  const [identityNo, setIdentityNo] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. Identity Validation (13 Digits)
    if (identityNo.length !== 13) {
      showToast('error', 'Invalid ID', 'Identity number must be 13 digits.');
      setLoading(false);
      return;
    }

    // 2. Password Match & Strength
    if (newPassword !== confirmPassword) {
      showToast('error', 'Mismatch', 'Passwords do not match.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      showToast('error', 'Security', 'Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      // 3. Query User in Firestore (Medical SaaS structure)
      const q = query(
        collection(db, 'users'),
        where('identityNo', '==', identityNo),
        where('role', '==', role)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        showToast('error', 'Not Found', `No ${role} record matches this ID.`);
        setLoading(false);
        return;
      }

      // 4. Update Password in Firestore
      const userDoc = snap.docs[0];
      await updateDoc(userDoc.ref, {
        password: newPassword, // In production, use Firebase Auth's sendPasswordResetEmail
        passwordUpdatedAt: new Date(),
      });

      showToast('success', 'Security Updated', 'Your password has been reset successfully.');
      
      setIdentityNo('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => window.location.href = '/login', 2000);

    } catch (err) {
      showToast('error', 'System Error', 'Database connection failed.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-viewport">
      <motion.div 
        className="premium-card reset-layout"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="visual-section">
           <div className="brand-logo-text">
            <span className="plus-icon">+</span> Clinic<span>Manager</span>
          </div>
          <div className="quote-box">
            <h1 className="quote-text">Account <span>Recovery</span></h1>
            <p className="quote-subtext">Verify your medical identity to restore secure access to your healthcare portal.</p>
          </div>
        </div>

        <div className="form-section">
          <div className="form-header">
            <h2>Reset Password</h2>
            <p>Enter your 13-digit Identity Number</p>
          </div>

          <div className="role-pills">
            {['patient', 'doctor', 'receptionist', 'admin'].map((r) => (
              <button 
                key={r}
                type="button" 
                className={role === r ? 'active' : ''} 
                onClick={() => setRole(r)}
              >
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleReset} className="auth-form">
            <div className="input-grp">
              <label>Identity Number (No dashes)</label>
              <input
                type="text"
                placeholder="4210100000000"
                value={identityNo}
                maxLength={13}
                onChange={e => setIdentityNo(e.target.value.replace(/\D/g, '').slice(0, 13))}
                required
              />
            </div>

            <div className="input-grp">
              <label>New Secure Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="input-grp">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Verifying Identity...' : 'Update Portal Password'}
            </button>
          </form>

          <div className="signup-link">
             <a href="/login" style={{ fontSize: '0.9rem' }}>← Back to Login</a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}