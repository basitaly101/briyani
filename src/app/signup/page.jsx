'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from '@/app/lib/firebase';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { showToast } from '@/app/utils/alert';
import './signup.css'; // Utilizing the consolidated Medical SaaS styles

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL Role mapping: Default to 'patient' if not specified
  const urlRole = searchParams.get('role');
  const initialRole = (urlRole === 'admin' || urlRole === 'patient') ? urlRole : 'patient';

  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    medicalId: '', // Replaced Father Name with Medical ID / Identity
    identityNo: '', // Formerly CNIC
    email: '',
    password: '',
    role: initialRole
  });

  // Sync role if URL param changes
  useEffect(() => {
    setFormData(prev => ({...prev, role: initialRole}));
  }, [initialRole]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Identity Number validation (generic 13-digit format)
    if (name === 'identityNo') {
      const val = value.replace(/\D/g, '').slice(0, 13);
      setFormData(prev => ({ ...prev, [name]: val }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (formData.identityNo.length !== 13) {
      showToast('error', 'Invalid ID', 'Identity Number must be exactly 13 digits.');
      return false;
    }
    if (formData.password.length < 6) {
      showToast('error', 'Security', 'Password must be at least 6 characters.');
      return false;
    }
    return true;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // 1. Create Auth User
      const res = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // 2. Logic: Admin (Clinic Owner) & Patients are auto-approved. 
      // Staff (Doctors/Receptionists) would usually require manual approval.
      const isApproved = (formData.role === 'admin' || formData.role === 'patient'); 

      // 3. Save to Firestore with SaaS Plan metadata
      await setDoc(doc(db, 'users', res.user.uid), {
        uid: res.user.uid,
        fullName: formData.fullName,
        medicalId: formData.medicalId,
        identityNo: formData.identityNo,
        email: formData.email,
        role: formData.role,
        approved: isApproved,
        plan: 'free', // Default SaaS Plan
        patientCount: 0, // SaaS Limit tracking
        createdAt: serverTimestamp(),
      });

      if (isApproved) {
        showToast('success', 'Account Created', 'Welcome to ClinicManager.');
        document.cookie = `clinic_role=${formData.role};path=/;max-age=86400;samesite=lax`;
        setTimeout(() => router.push(`/${formData.role}/dashboard`), 1500);
      } else {
        // Staff Flow
        showToast('success', 'Registration Pending', 'Your staff account awaits clinic approval.');
        await signOut(auth);
        setTimeout(() => router.push('/login'), 3000);
      }

    } catch (err) {
      let message = "Registration failed.";
      if (err.code === 'auth/email-already-in-use') message = "Email already in use.";
      showToast('error', 'Auth Error', message);
      setLoading(false);
    }
  };

  return (
    <div className="login-viewport">
      <div className="premium-card" style={{ gridTemplateColumns: '1fr' }}> 
        <div className="form-section" style={{ maxWidth: '500px', margin: '0 auto', width: '100%' }}>
          
          <div className="form-header" style={{ textAlign: 'center' }}>
            <h2>{formData.role === 'admin' ? 'Clinic Registration' : 'Patient Enrollment'}</h2>
            <p>Secure Healthcare Ecosystem</p>
          </div>

          <form onSubmit={handleSignUp} className="auth-form" style={{ marginTop: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="input-grp">
                <label>Full Name</label>
                <input name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="John Doe" required />
              </div>
              <div className="input-grp">
                <label>{formData.role === 'admin' ? 'Clinic License' : 'Medical ID'}</label>
                <input name="medicalId" value={formData.medicalId} onChange={handleInputChange} placeholder="ID-XXXX" required />
              </div>
            </div>

            <div className="input-grp">
              <label>Identity Number (13 Digits)</label>
              <input name="identityNo" placeholder="42101XXXXXXXX" value={formData.identityNo} onChange={handleInputChange} required />
            </div>

            <div className="input-grp">
              <label>Email Address</label>
              <input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="name@healthcare.com" required />
            </div>

            <div className="input-grp">
              <label>Password</label>
              <input name="password" type="password" value={formData.password} onChange={handleInputChange} placeholder="••••••••" required />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? <span className="loader-text">Creating Profile...</span> : `Register as ${formData.role.toUpperCase()}`}
            </button>
            
            <p className="signup-link" style={{ marginTop: '20px' }}>
              Already a member? <span onClick={() => router.push('/login')} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '700' }}>Login</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="login-viewport">Loading Registration...</div>}>
      <SignUpForm />
    </Suspense>
  );
}