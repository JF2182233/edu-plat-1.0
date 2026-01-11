import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserWithProgress { id: string; email: string; display_name: string | null; progress: { module_title: string; percent: number; completed: boolean; }[]; }

const AdminUsers = () => {
  const { t, language } = useLanguage();
  const [users, setUsers] = useState<UserWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const getLocalizedContent = (sv: string, en: string) => language === 'en' ? en : sv;

  useEffect(() => {
    const fetch = async () => {
      const [profilesRes, modulesRes, progressRes] = await Promise.all([
        supabase.from('profiles').select('id, email, display_name'),
        supabase.from('modules').select('id, title_sv, title_en'),
        supabase.from('user_progress').select('*'),
      ]);

      if (profilesRes.data && modulesRes.data && progressRes.data) {
        const usersData = profilesRes.data.map(profile => {
          const userProgress = progressRes.data.filter(p => p.user_id === profile.id);
          const progress = modulesRes.data.map(m => {
            const p = userProgress.find(up => up.module_id === m.id);
            let steps = 0;
            if (p?.step_read_done) steps++;
            if (p?.step_watch_done) steps++;
            if (p?.completed_at) steps++;
            return { module_title: getLocalizedContent(m.title_sv, m.title_en), percent: Math.round((steps / 3) * 100), completed: !!p?.completed_at };
          });
          return { id: profile.id, email: profile.email, display_name: profile.display_name, progress };
        });
        setUsers(usersData);
      }
      setLoading(false);
    };
    fetch();
  }, [language]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />{t('admin.backToAdmin')}
          </Link>
          <LanguageToggle />
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-bold mb-8">{t('admin.users')}</h1>
        
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">{t('admin.noUsersYet')}</div>
        ) : (
          <div className="space-y-4">
            {users.map((u) => (
              <div key={u.id} className="glass-card rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{u.display_name || t('admin.unnamedUser')}</h3>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {u.progress.map((p, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-sm w-40 truncate">{p.module_title}</span>
                      <Progress value={p.percent} className="flex-1 h-2" />
                      <span className="text-sm w-12 text-right">{p.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminUsers;
