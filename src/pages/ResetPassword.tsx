import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Eye, EyeOff, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword, loading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      // Redirect to forgot password if no token
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  // Password validation rules
  const passwordRules = {
    minLength: formData.newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(formData.newPassword),
    hasLowercase: /[a-z]/.test(formData.newPassword),
    hasNumber: /\d/.test(formData.newPassword),
    matches: formData.newPassword === formData.confirmPassword && formData.confirmPassword !== ''
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Password validation
    if (!formData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (!passwordRules.minLength) {
      errors.newPassword = 'Password must be at least 8 characters long';
    } else if (!passwordRules.hasUppercase) {
      errors.newPassword = 'Password must contain at least one uppercase letter';
    } else if (!passwordRules.hasLowercase) {
      errors.newPassword = 'Password must contain at least one lowercase letter';
    } else if (!passwordRules.hasNumber) {
      errors.newPassword = 'Password must contain at least one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (!passwordRules.matches) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!token) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      await resetPassword(token, formData.newPassword, formData.confirmPassword);
      setIsSuccess(true);
    } catch (error) {
      // Error is handled by the AuthContext
      console.error('Password reset failed:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Password Reset Successful</CardTitle>
            <CardDescription className="text-center">
              Your password has been updated successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                You can now sign in with your new password.
              </AlertDescription>
            </Alert>
            
            <Link to="/login">
              <Button className="w-full">
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token) {
    return null; // Will redirect to forgot password
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset Your Password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="Enter your new password"
                  className={validationErrors.newPassword ? 'border-red-500 pr-10' : 'pr-10'}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {validationErrors.newPassword && (
                <p className="text-sm text-red-500">{validationErrors.newPassword}</p>
              )}
              
              {/* Password strength indicator */}
              {formData.newPassword && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Password requirements:</p>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {passwordRules.minLength ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                      <span className="text-sm">At least 8 characters</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {passwordRules.hasUppercase ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                      <span className="text-sm">One uppercase letter</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {passwordRules.hasLowercase ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                      <span className="text-sm">One lowercase letter</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {passwordRules.hasNumber ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                      <span className="text-sm">One number</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your new password"
                  className={validationErrors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <p className="text-sm text-red-500">{validationErrors.confirmPassword}</p>
              )}
              {formData.confirmPassword && passwordRules.matches && (
                <p className="text-sm text-green-500 flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>Passwords match</span>
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !Object.values(passwordRules).every(Boolean)}
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              to="/login" 
              className="text-sm text-blue-600 hover:text-blue-500 font-medium flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword; 