'use client';

/**
 * Clinic Management System - Notification Utility
 * Provides a standardized way to trigger UI toasts across all roles.
 */

const VARIANT_MAP = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

/**
 * showToast
 * @param {string} variant - success | error | warning | info
 * @param {string} title - The heading of the alert
 * @param {string} description - The sub-text message
 */
export const showToast = (variant, title, description) => {
  if (typeof window === 'undefined') return;

  // Renamed global hook from __staffcore_toast to __clinic_toast
  const fn = window.__clinic_toast;

  if (typeof fn === 'function') {
    fn({
      variant: VARIANT_MAP[variant] || 'info',
      title,
      description,
    });
  } else {
    // Fallback for development if the Toast container isn't mounted
    console.warn(`Toast: [${variant.toUpperCase()}] ${title} - ${description}`);
  }
};

/**
 * showAuthSuccess
 * Specialized alert for login/signup transitions
 * @param {string} role - patient | doctor | receptionist | admin
 */
export const showAuthSuccess = (role) => {
  const portalName = String(role || 'User').toUpperCase();
  
  return showToast(
    'success',
    'Access Granted',
    `Securely entering the ${portalName} Portal...`
  );
};

/**
 * showSubscriptionLimit
 * Specifically for the SaaS 'Free Plan' constraints
 */
export const showSubscriptionLimit = () => {
  return showToast(
    'warning',
    'Plan Limit Reached',
    'You have reached the patient limit for the Free Plan. Please upgrade to Pro.'
  );
};