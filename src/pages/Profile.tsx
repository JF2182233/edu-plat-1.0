import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, User } from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';

const Profile = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || '');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.updateUser({ data: { display_name: displayName } });
    
    if (error) {
      toast({ variant: 'destructive', title: t('toast.error'), description: error.message });
    } else {
      await supabase.from('profiles').update({ display_name: displayName }).eq('id', user?.id);
      toast({ title: t('profile.updated'), description: t('profile.updatedDesc') });
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/app" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />{t('module.backToDashboard')}
          </Link>
          <LanguageToggle />
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-md">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">{t('profile.title')}</h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6 glass-card rounded-2xl p-6">
          <div className="space-y-2">
            <Label htmlFor="displayName">{t('profile.displayName')}</Label>
            <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label>{t('auth.email')}</Label>
            <Input value={user?.email || ''} disabled className="bg-muted" />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('profile.saving')}</> : t('profile.saveChanges')}
          </Button>
        </form>

        <div className="mt-8 pt-8 border-t border-border">
          <Button variant="destructive" onClick={handleSignOut} className="w-full">{t('profile.signOut')}</Button>
        </div>
      </main>
    </div>
  );
};

export default Profile;
