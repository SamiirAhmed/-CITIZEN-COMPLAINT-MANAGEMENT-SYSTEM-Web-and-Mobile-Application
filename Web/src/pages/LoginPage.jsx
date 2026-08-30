import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import LOGO_SRC from '../assets/branding';
import { useAuth } from '../context/AuthContext';
import { getFirstAllowedPath } from '../navigation/adminNavigation';
import { validateLogin } from '../validation/authenticationValidation';
import { getHomePath } from '../navigation/adminNavigation';

export default function LoginPage() {
  const { isAuthenticated, user, login } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
<<<<<<< HEAD
    if (user?.passwordChangeRequired) {
      return <Navigate to="/change-password-required" replace />;
    }
    return <Navigate to={getFirstAllowedPath(user)} replace />;
=======
    return <Navigate to={getHomePath(user)} replace />;
>>>>>>> da921d70880b08e5b0f04686ff0264e78d57ccae
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
      const result = await login(validation.data.email, validation.data.password);
<<<<<<< HEAD
      if (result.user?.passwordChangeRequired) {
        navigate('/change-password-required', { replace: true });
      } else {
        navigate(getFirstAllowedPath(result.user), { replace: true });
      }
=======
      navigate(getHomePath(result.user), { replace: true });
>>>>>>> da921d70880b08e5b0f04686ff0264e78d57ccae
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
            <h1>Sign In</h1>
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
              placeholder="you@spf.gov.so"
            />
            <small className="field-hint">Enter your registered email address.</small>
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
            <small className="field-hint">Enter your account password.</small>
            {errors.password ? <em className="field-error">{errors.password}</em> : null}
          </label>

          <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
