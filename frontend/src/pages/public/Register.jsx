import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => navigate('/login'), 2000);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
      });
      setSuccess(true);
    } catch (err) {
      if (err.response?.status === 422) {
        setFieldErrors(err.response.data.errors || {});
        setError('Please correct the errors below');
      } else {
        setError('An error occurred during registration. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F7F7F7] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-heading font-bold text-3xl">
            <span style={{ color: '#F80000' }}>Vengineers</span>
          </Link>
          <h1 className="font-heading text-2xl font-bold mt-6 mb-2 text-black">Create an account</h1>
          <p className="text-[#707070] text-sm">
            Client registration — Access to exclusive resources
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded border border-gray-200 shadow-sm space-y-4"
        >
          {error && (
            <div className="p-4 rounded text-white text-sm" style={{ backgroundColor: '#F80000' }}>
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 rounded text-white text-sm" style={{ backgroundColor: '#10b981' }}>
              Registration successful! Redirecting to login...
            </div>
          )}

          <div>
            <label htmlFor="register-fullName" className="block text-sm font-semibold mb-2 text-black">
              Full name *
            </label>
            <input
              id="register-fullName"
              type="text"
              name="fullName"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F80000]"
            />
            {fieldErrors.name && (
              <p className="text-xs mt-1" style={{ color: '#C62221' }}>{fieldErrors.name[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="register-email" className="block text-sm font-semibold mb-2 text-black">
              Professional email *
            </label>
            <input
              id="register-email"
              type="email"
              name="email"
              placeholder="john@company.com"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F80000]"
            />
            {fieldErrors.email && (
              <p className="text-xs mt-1" style={{ color: '#C62221' }}>{fieldErrors.email[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="register-phone" className="block text-sm font-semibold mb-2 text-black">
              Phone
            </label>
            <input
              id="register-phone"
              type="tel"
              name="phone"
              placeholder="+230 XXXX XXXX"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F80000]"
            />
            {fieldErrors.phone && (
              <p className="text-xs mt-1" style={{ color: '#C62221' }}>{fieldErrors.phone[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="register-password" className="block text-sm font-semibold mb-2 text-black">
              Password *
            </label>
            <div className="relative">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-2 pr-11 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F80000]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-xs mt-1" style={{ color: '#C62221' }}>{fieldErrors.password[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="register-confirmPassword" className="block text-sm font-semibold mb-2 text-black">
              Confirm password *
            </label>
            <div className="relative">
              <input
                id="register-confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Repeat your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-2 pr-11 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F80000]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" required className="rounded" />
            <span className="text-sm text-[#707070]">
              I accept the{' '}
              <Link to="#" className="text-blue-600 hover:underline">
                terms and conditions
              </Link>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 rounded text-white font-semibold transition-colors disabled:opacity-60"
            style={{ backgroundColor: '#F80000' }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#C62221')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#F80000')}
          >
            {loading ? 'Creating account...' : 'Create my account'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-[#707070] text-sm">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold transition-colors" style={{ color: '#F80000' }}>
              Log in
            </Link>
          </p>
        </div>

        <div className="text-center mt-4">
          <Link to="/" className="text-[#707070] text-sm hover:text-black transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}