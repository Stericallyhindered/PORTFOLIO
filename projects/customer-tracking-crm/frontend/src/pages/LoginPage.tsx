import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, Shield, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LoginForm } from '../types';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginForm>({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { state, login, clearError } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (state.isAuthenticated) {
      navigate('/dashboard');
    }
  }, [state.isAuthenticated, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (state.error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(formData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    {
      role: 'admin',
      username: 'admin',
      password: 'change-me-demo-password',
      title: 'Administrator',
      description: 'Full system access, user management, approvals',
      icon: Shield,
      color: 'from-kraken-red to-kraken-red-hover'
    },
    {
      role: 'sales',
      username: 'sales',
      password: 'sales123',
      title: 'Sales Agent',
      description: 'Create orders, manage contacts, submit for approval',
      icon: Users,
      color: 'from-kraken-orange to-kraken-orange-hover'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-kraken-black via-kraken-dark to-kraken-black flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #DC2626 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, #FF6B35 0%, transparent 50%)`,
        }} />
      </div>

      <div className="relative w-full max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Branding */}
          <div className="text-center lg:text-left space-y-8 animate-fade-in">
            <div className="space-y-4">
              <div className="flex items-center justify-center lg:justify-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-kraken-red to-kraken-orange rounded-2xl flex items-center justify-center shadow-xl">
                  <Zap size={32} className="text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white">Kraken Marine</h1>
                  <p className="text-kraken-gray text-lg">Customer Tracking System</p>
                </div>
              </div>
              
              <p className="text-kraken-gray text-lg max-w-md mx-auto lg:mx-0">
                Professional marine battery tracking and order management system. 
                Built for high-performance operations with real-time monitoring.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-kraken-gray">
                <div className="w-2 h-2 bg-kraken-red rounded-full"></div>
                <span>Real-time order tracking</span>
              </div>
              <div className="flex items-center space-x-3 text-kraken-gray">
                <div className="w-2 h-2 bg-kraken-orange rounded-full"></div>
                <span>Mobile document scanning</span>
              </div>
              <div className="flex items-center space-x-3 text-kraken-gray">
                <div className="w-2 h-2 bg-kraken-red rounded-full"></div>
                <span>Customer portal access</span>
              </div>
              <div className="flex items-center space-x-3 text-kraken-gray">
                <div className="w-2 h-2 bg-kraken-orange rounded-full"></div>
                <span>Approval workflows</span>
              </div>
            </div>
          </div>

          {/* Right side - Login Form */}
          <div className="w-full max-w-md mx-auto">
            <div className="card animate-slide-in">
              <div className="card-header text-center">
                <h2 className="card-title">Welcome Back</h2>
                <p className="card-subtitle">Sign in to your account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="form-group">
                  <label htmlFor="username" className="form-label">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your username"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="form-input pr-12"
                      placeholder="Enter your password"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-kraken-gray hover:text-white transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {state.error && (
                  <div className="p-3 bg-kraken-red/20 border border-kraken-red/50 rounded-lg">
                    <p className="text-kraken-red text-sm">{state.error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              {/* Demo Accounts */}
              <div className="mt-8 pt-6 border-t border-glass-border">
                <h3 className="text-sm font-medium text-kraken-gray mb-4 text-center">
                  Demo Accounts
                </h3>
                <div className="space-y-3">
                  {demoAccounts.map((account) => {
                    const Icon = account.icon;
                    return (
                      <button
                        key={account.role}
                        onClick={() => {
                          setFormData({
                            username: account.username,
                            password: account.password,
                          });
                        }}
                        className="w-full p-3 bg-glass-bg hover:bg-glass-hover border border-glass-border rounded-lg transition-all duration-200 group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 bg-gradient-to-br ${account.color} rounded-lg flex items-center justify-center`}>
                            <Icon size={16} className="text-white" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-white group-hover:text-kraken-orange transition-colors">
                              {account.title}
                            </p>
                            <p className="text-xs text-kraken-gray">
                              {account.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
