import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserWithProgress {
  id: string;
  email: string;
  display_name: string | null;
  progress: { module_title: string; percent: number; completed: boolean }[];
}

interface ModuleSummary {
  id: string;
  title_sv: string;
  title_en: string;
}

interface ModuleTopicSummary {
  id: string;
  module_id: string;
}

const AdminUsers = () => {
  const { t, language } = useLanguage();
  const [users, setUsers] = useState<UserWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const getLocalizedContent = (sv: string, en: string) => language === 'en' ? en : sv;

  const moduleTitle = useMemo(() => (module: ModuleSummary) => getLocalizedContent(module.title_sv, module.title_en), [language]);

  useEffect(() => {
    const fetch = async () => {
      const [profilesRes, modulesRes, topicsRes, progressRes] = await Promise.all([
        supabase.from('profiles').select('id, email, display_name'),
        supabase.from('modules').select('id, title_sv, title_en'),
        supabase.from('module_topics').select('id, module_id'),
        supabase.from('topic_progress').select('user_id, topic_id, completed_at'),
      ]);

      if (profilesRes.data && modulesRes.data && topicsRes.data && progressRes.data) {
        const topicsByModule = topicsRes.data.reduce<Record<string, ModuleTopicSummary[]>>((acc, topic) => {
          acc[topic.module_id] = acc[topic.module_id] || [];
          acc[topic.module_id].push(topic);
          return acc;
        }, {});

        const progressByUser = progressRes.data.reduce<Record<string, Set<string>>>((acc, entry) => {
          if (!entry.completed_at) return acc;
          acc[entry.user_id] = acc[entry.user_id] || new Set();
          acc[entry.user_id].add(entry.topic_id);
          return acc;
        }, {});

        const usersData = profilesRes.data.map((profile) => {
          const completedTopics = progressByUser[profile.id] || new Set<string>();
          const progress = modulesRes.data.map((module) => {
            const moduleTopics = topicsByModule[module.id] || [];
            if (moduleTopics.length === 0) {
              return { module_title: moduleTitle(module), percent: 0, completed: false };
            }

            const completedCount = moduleTopics.filter((topic) => completedTopics.has(topic.id)).length;
            const percent = Math.round((completedCount / moduleTopics.length) * 100);
            return {
              module_title: moduleTitle(module),
              percent,
              completed: completedCount === moduleTopics.length,
            };
          });

          return { id: profile.id, email: profile.email, display_name: profile.display_name, progress };
        });

        setUsers(usersData);
      }
      setLoading(false);
    };
    fetch();
  }, [language, moduleTitle]);

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
