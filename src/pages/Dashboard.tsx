import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Play, Clock, CheckCircle2, ArrowRight, User, LogOut, Settings } from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';
import { formatDistanceToNow } from 'date-fns';
import { sv, enUS } from 'date-fns/locale';

interface Module {
  id: string;
  title_sv: string;
  title_en: string;
  description_sv: string;
  description_en: string;
}

interface ModuleTopicSummary {
  id: string;
  module_id: string;
}

interface TopicProgress {
  topic_id: string;
  completed_at: string | null;
  updated_at: string;
}

const Dashboard = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { t, language } = useLanguage();
  const [modules, setModules] = useState<Module[]>([]);
  const [topics, setTopics] = useState<ModuleTopicSummary[]>([]);
  const [progress, setProgress] = useState<TopicProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const getLocalizedContent = (sv: string, en: string) => language === 'en' ? en : sv;

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const [modulesRes, topicsRes, progressRes] = await Promise.all([
        supabase.from('modules').select('id, title_sv, title_en, description_sv, description_en').eq('is_published', true).order('sort_order'),
        supabase.from('module_topics').select('id, module_id').order('sort_order'),
        supabase.from('topic_progress').select('topic_id, completed_at, updated_at').eq('user_id', user.id),
      ]);

      if (modulesRes.data) setModules(modulesRes.data);
      if (topicsRes.data) setTopics(topicsRes.data);
      if (progressRes.data) setProgress(progressRes.data);

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const progressByModule = useMemo(() => {
    const topicsByModule = topics.reduce<Record<string, ModuleTopicSummary[]>>((acc, topic) => {
      acc[topic.module_id] = acc[topic.module_id] || [];
      acc[topic.module_id].push(topic);
      return acc;
    }, {});

    const progressByTopic = progress.reduce<Record<string, TopicProgress>>((acc, entry) => {
      acc[entry.topic_id] = entry;
      return acc;
    }, {});

    const moduleProgressMap = new Map<string, { total: number; completed: number; updatedAt?: string }>();

    Object.entries(topicsByModule).forEach(([moduleId, moduleTopics]) => {
      let completedCount = 0;
      let latestUpdate = '';

      moduleTopics.forEach((topic) => {
        const entry = progressByTopic[topic.id];
        if (entry?.completed_at) completedCount += 1;
        if (entry?.updated_at && entry.updated_at > latestUpdate) {
          latestUpdate = entry.updated_at;
        }
      });

      moduleProgressMap.set(moduleId, {
        total: moduleTopics.length,
        completed: completedCount,
        updatedAt: latestUpdate || undefined,
      });
    });

    return moduleProgressMap;
  }, [topics, progress]);

  const getModuleProgress = (moduleId: string) => {
    const entry = progressByModule.get(moduleId);
    if (!entry || entry.total === 0) {
      return { percent: 0, status: 'not_started' as const, updatedAt: undefined };
    }

    const percent = Math.round((entry.completed / entry.total) * 100);
    const status = entry.completed === entry.total ? 'completed' : entry.completed > 0 ? 'in_progress' : 'not_started';

    return { percent, status, updatedAt: entry.updatedAt };
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const dateLocale = language === 'sv' ? sv : enUS;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/app" className="flex items-center gap-3">
            <img
              src="/singelportalen-logo.svg"
              alt="Singelportalen logo"
              className="h-9 w-auto"
            />
            <span className="font-display text-lg font-bold text-foreground">Onboarding</span>
          </Link>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            {isAdmin && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin">
                  <Settings className="h-4 w-4 mr-2" />
                  {t('dashboard.admin')}
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/profile">
                <User className="h-4 w-4 mr-2" />
                {t('dashboard.profile')}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              {t('dashboard.logout')}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            {t('dashboard.welcomeBack')}{user?.user_metadata?.display_name ? `, ${user.user_metadata.display_name}` : ''}!
          </h1>
          <p className="text-muted-foreground">
            {t('dashboard.continueJourney')}
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-muted rounded w-3/4 mb-3" />
                <div className="h-4 bg-muted rounded w-full mb-6" />
                <div className="h-2 bg-muted rounded w-full mb-4" />
                <div className="h-10 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : modules.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">
              {t('dashboard.noModulesAvailable')}
            </h2>
            <p className="text-muted-foreground">
              {t('dashboard.checkBackLater')}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => {
              const { percent, status, updatedAt } = getModuleProgress(module.id);

              return (
                <div
                  key={module.id}
                  className="glass-card rounded-2xl p-6 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      {getLocalizedContent(module.title_sv, module.title_en)}
                    </h3>
                    {status === 'completed' && (
                      <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    )}
                  </div>

                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {getLocalizedContent(module.description_sv, module.description_en)}
                  </p>

                  <div className="space-y-3 mb-5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('dashboard.progress')}</span>
                      <span className="font-medium text-foreground">{percent}%</span>
                    </div>
                    <Progress value={percent} className="h-2" />
                  </div>

                  {updatedAt && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {t('dashboard.lastActivity')} {formatDistanceToNow(new Date(updatedAt), { addSuffix: true, locale: dateLocale })}
                      </span>
                    </div>
                  )}

                  <Button
                    variant={status === 'completed' ? 'secondary' : 'default'}
                    className="w-full"
                    asChild
                  >
                    <Link to={`/app/module/${module.id}`}>
                      {status === 'not_started' && (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          {t('dashboard.startModule')}
                        </>
                      )}
                      {status === 'in_progress' && (
                        <>
                          {t('dashboard.continue')}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                      {status === 'completed' && (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          {t('dashboard.review')}
                        </>
                      )}
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
