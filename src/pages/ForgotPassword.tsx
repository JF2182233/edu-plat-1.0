import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';
import { z } from 'zod';

const ForgotPassword = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const emailSchema = z.string().email(t('validation.validEmail'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    
    const { error: resetError } = await resetPassword(email);
    
    if (resetError) {
      toast({
        variant: 'destructive',
        title: t('toast.error'),
        description: resetError.message,
      });
    } else {
      setSent(true);
      toast({
        title: t('toast.emailSent'),
        description: t('toast.checkInbox'),
      });
    }
    
    setLoading(false);
  };

  if (sent) {
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
            {t('auth.checkYourEmail')}
          </h1>
          <p className="text-muted-foreground mb-8">
            {t('auth.sentInstructionsTo')} <strong>{email}</strong>.
          </p>
          <Button variant="outline" asChild>
            <Link to="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
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
          {t('auth.resetPassword')}
        </h1>
        <p className="text-muted-foreground mb-8">
          {t('auth.resetInstructions')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={error ? 'border-destructive' : ''}
              disabled={loading}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <Button type="submit" variant="hero" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('auth.sending')}
              </>
            ) : (
              t('auth.sendResetInstructions')
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
