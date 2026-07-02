import { useState } from 'react';
import { useAuth } from '../services/api/auth';
import { Link, useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMessage = typeof data.detail === 'string'
          ? data.detail
          : (data.detail?.[0]?.msg || 'Login failed');
        throw new Error(errorMessage);
      }

      const data = await response.json();
      login(data.access_token);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-surface p-5 font-sans">
      <div className="bg-bg p-10 rounded-xl shadow-lg w-full max-w-[400px] border border-border">
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">Welcome Back</h1>
        <p className="text-gray-500 mb-8 text-sm">Please enter your details to login.</p>
        
        {error && (
          <div className="bg-brand-light text-danger p-3 rounded-md mb-6 text-sm border border-danger">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              className="p-3 border border-border rounded-md text-base transition-colors duration-200 bg-bg focus:outline-none focus:border-brand focus:ring-3 focus:ring-brand/10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@company.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              className="p-3 border border-border rounded-md text-base transition-colors duration-200 bg-bg focus:outline-none focus:border-brand focus:ring-3 focus:ring-brand/10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="p-3 bg-brand text-white border-none rounded-md text-base font-semibold cursor-pointer transition-colors duration-200 hover:bg-brand-hover disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          Don't have an account? <Link to="/register" className="text-brand no-underline font-medium hover:underline">Register</Link>
        </div>
      </div>
    </div>
  );
}
