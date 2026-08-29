import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import LOGO_SRC from '../assets/branding';
import { useAuth } from '../context/AuthContext';
import { validateLogin } from '../validation/authenticationValidation';

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    const validation = validateLogin(values);
    setErrors(validation.errors);
    if (!validation.ok) return;

    setSubmitting(true);
    try {
      await login(validation.data.email, validation.data.password);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(error.message || 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__panel">
        <div className="login-page__brand">
          <img src={LOGO_SRC} alt="SPO logo" />
          <div>
            <p className="login-page__system">SPO — Somali Police OBE</p>
            <h1>Admin Portal</h1>
            <p className="muted">Secure access for police administration staff.</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {formError ? <div className="alert alert--error">{formError}</div> : null}

          <label className="field">
            <span>Email</span>
            <input
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              autoComplete="username"
              placeholder="admin@spf.gov.so"
            />
            {errors.email ? <em className="field-error">{errors.email}</em> : null}
          </label>

          <label className="field">
            <span>Password</span>
            <input
              name="password"
              type="password"
              value={values.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
            {errors.password ? <em className="field-error">{errors.password}</em> : null}
          </label>

          <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
