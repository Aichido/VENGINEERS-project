import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DASHBOARD_PATH_BY_ROLE } from '../../constants/roles';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const user = await login(formData.email, formData.password);
      navigate(DASHBOARD_PATH_BY_ROLE[user?.role?.name] || '/');
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else {
        setError('An error occurred. Please try again.');
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
          <h1 className="font-heading text-2xl font-bold mt-6 mb-2 text-black">Login</h1>
          <p className="text-[#707070] text-sm">
            Sign in to your Vengineers account
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

          <div>
            <label htmlFor="login-email" className="block text-sm font-semibold mb-2 text-black">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F80000]"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-semibold mb-2 text-black">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Your password"
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
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-[#707070]">
              <input type="checkbox" className="rounded" />
              <span>Remember me</span>
            </label>
            <Link to="#" className="text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 rounded text-white font-semibold transition-colors disabled:opacity-60"
            style={{ backgroundColor: '#F80000' }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#C62221')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#F80000')}
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-[#707070] text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold transition-colors" style={{ color: '#F80000' }}>
              Create one
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