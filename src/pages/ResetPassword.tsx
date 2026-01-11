import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const ResetPassword = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  
  const { toast } = useToast();

  const passwordSchema = z.string().min(6, t('validation.passwordMin'));

  useEffect(() => {
    // Check if user came from a password reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check URL for recovery token indicators
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      
      if (session || type === 'recovery') {
        setIsValidSession(true);
      } else {
        // No valid session, redirect to forgot password
        toast({
          variant: 'destructive',
          title: t('toast.error'),
          description: t('auth.invalidResetLink'),
        });
        navigate('/forgot-password');
      }
      setCheckingSession(false);
    };

    checkSession();
  }, [navigate, toast, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setConfirmError('');
    
    // Validate password
    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    // Check passwords match
    if (password !== confirmPassword) {
      setConfirmError(t('validation.passwordsMatch'));
      return;
    }

    setLoading(true);
    
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });
    
    if (updateError) {
      toast({
        variant: 'destructive',
        title: t('toast.error'),
        description: updateError.message,
      });
    } else {
      setSuccess(true);
      toast({
        title: t('toast.success'),
        description: t('auth.passwordUpdated'),
      });
    }
    
    setLoading(false);
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="absolute top-6 right-6">
            <LanguageToggle />
          </div>
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            {t('auth.passwordUpdated')}
          </h1>
          <p className="text-muted-foreground mb-8">
            {t('auth.passwordUpdatedDescription')}
          </p>
          <Button variant="hero" asChild>
            <Link to="/login">
              {t('auth.backToLogin')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="flex items-center justify-between mb-8">
          <Link to="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t('auth.backToLogin')}
          </Link>
          <LanguageToggle />
        </div>
        
        <div className="flex items-center gap-3 mb-8">
          <img
            src="/singelportalen-logo.svg"
            alt="Singelportalen logo"
            className="h-10 w-auto"
          />
          <span className="font-display text-xl font-bold text-foreground">Onboarding</span>
        </div>

        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          {t('auth.setNewPassword')}
        </h1>
        <p className="text-muted-foreground mb-8">
          {t('auth.setNewPasswordDescription')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.newPassword')}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={error ? 'border-destructive pr-10' : 'pr-10'}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('auth.confirmNewPassword')}</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={confirmError ? 'border-destructive pr-10' : 'pr-10'}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmError && (
              <p className="text-sm text-destructive">{confirmError}</p>
            )}
          </div>

          <Button type="submit" variant="hero" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('auth.updating')}
              </>
            ) : (
              t('auth.updatePassword')
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
