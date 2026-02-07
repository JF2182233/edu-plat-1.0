import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Video, HelpCircle, Trophy, ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';
import ReactMarkdown from 'react-markdown';

interface Module {
  id: string;
  title_sv: string;
  title_en: string;
  description_sv: string;
  description_en: string;
  read_content_sv: string;
  read_content_en: string;
}

interface ModuleTopic {
  id: string;
  module_id: string;
  title_sv: string;
  title_en: string;
  description_sv: string;
  description_en: string;
  read_content_sv: string;
  read_content_en: string;
  video_url: string;
  sort_order: number;
}

// Questions without answers (for quiz taking)
interface QuizQuestion {
  id: string;
  question_text: string;
  options: string[];
  sort_order: number;
}

// Questions with answers (for results display after completion)
interface QuizResult {
  question_id: string;
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  sort_order: number;
}

interface TopicProgress {
  id: string;
  topic_id: string;
  step_read_done: boolean;
  step_watch_done: boolean;
  quiz_attempts: number;
  latest_score: number;
  best_score: number;
  completed_at: string | null;
  updated_at: string;
}

const ModulePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();

  const [module, setModule] = useState<Module | null>(null);
  const [topics, setTopics] = useState<ModuleTopic[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [topicProgress, setTopicProgress] = useState<Record<string, TopicProgress>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const steps = useMemo(() => [
    { id: 'read', label: t('module.read'), icon: BookOpen },
    { id: 'watch', label: t('module.watch'), icon: Video },
    { id: 'quiz', label: t('module.quiz'), icon: HelpCircle },
    { id: 'done', label: t('module.done'), icon: Trophy },
  ], [t]);

  const getLocalizedContent = (sv: string, en: string) => language === 'en' ? en : sv;

  const currentTopic = topics[currentTopicIndex];

  const getTopicStep = (progress?: TopicProgress) => {
    if (progress?.completed_at) return 3;
    if (progress?.step_watch_done) return 2;
    if (progress?.step_read_done) return 1;
    return 0;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !user) return;

      const [moduleRes, topicsRes] = await Promise.all([
        supabase.from('modules').select('*').eq('id', id).single(),
        supabase.from('module_topics').select('*').eq('module_id', id).order('sort_order'),
      ]);

      if (moduleRes.data) setModule(moduleRes.data);
      if (topicsRes.data) {
        setTopics(topicsRes.data);
        setCurrentTopicIndex(0);
      }

      if (topicsRes.data && topicsRes.data.length > 0) {
        const topicIds = topicsRes.data.map((topic) => topic.id);
        const { data: progressData } = await supabase
          .from('topic_progress')
          .select('*')
          .eq('user_id', user.id)
          .in('topic_id', topicIds);

        if (progressData) {
          const progressMap: Record<string, TopicProgress> = {};
          progressData.forEach((entry) => {
            progressMap[entry.topic_id] = entry;
          });
          setTopicProgress(progressMap);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [id, user]);

  useEffect(() => {
    if (!currentTopic) return;

    const progress = topicProgress[currentTopic.id];
    setCurrentStep(getTopicStep(progress));
    setShowResults(!!progress?.completed_at);
    setAnswers({});
    setQuizResults([]);
    setQuestions([]);

    const fetchQuestions = async () => {
      const { data } = await supabase.rpc('get_quiz_questions', { p_topic_id: currentTopic.id });
      if (data) {
        setQuestions(data.map((q: any) => ({
          ...q,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
        })));
      }
    };

    fetchQuestions();

    if (progress?.completed_at) {
      fetchQuizResults(currentTopic.id);
    }
  }, [currentTopic, topicProgress]);

  const fetchQuizResults = async (topicId: string) => {
    const { data, error } = await supabase.rpc('get_quiz_results', { p_topic_id: topicId });
    if (data && !error) {
      setQuizResults(data.map((q: any) => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
      })));
    }
  };

  const ensureTopicProgress = async (topicId: string) => {
    if (!user) return null;
    if (topicProgress[topicId]) return topicProgress[topicId];

    const { data } = await supabase.from('topic_progress').insert({
      user_id: user.id,
      topic_id: topicId,
    }).select().single();

    if (data) {
      setTopicProgress((prev) => ({ ...prev, [topicId]: data }));
    }

    return data ?? null;
  };

  const updateProgress = async (topicId: string, updates: Partial<TopicProgress>) => {
    const progress = topicProgress[topicId] ?? await ensureTopicProgress(topicId);
    if (!progress) return;

    const { data } = await supabase
      .from('topic_progress')
      .update(updates)
      .eq('id', progress.id)
      .select()
      .single();

    if (data) {
      setTopicProgress((prev) => ({ ...prev, [topicId]: data }));
    }
  };

  const handleReadComplete = async () => {
    if (!currentTopic) return;
    await updateProgress(currentTopic.id, { step_read_done: true });
    setCurrentStep(1);
  };

  const handleWatchComplete = async () => {
    if (!currentTopic) return;
    await updateProgress(currentTopic.id, { step_watch_done: true });
    setCurrentStep(2);
  };

  const handleSubmitQuiz = async () => {
    if (!currentTopic) return;
    setSubmitting(true);

    try {
      const { data, error } = await supabase.rpc('submit_quiz_answers', {
        p_topic_id: currentTopic.id,
        p_answers: answers,
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: t('toast.error'),
          description: error.message,
        });
        setSubmitting(false);
        return;
      }

      const result = data as { score: number; total: number; percentage: number; best_score: number };

      setQuizScore(result.percentage);
      setShowResults(true);
      setCurrentStep(3);

      await fetchQuizResults(currentTopic.id);

      const { data: updatedProgress } = await supabase
        .from('topic_progress')
        .select('*')
        .eq('user_id', user!.id)
        .eq('topic_id', currentTopic.id)
        .single();

      if (updatedProgress) {
        setTopicProgress((prev) => ({ ...prev, [currentTopic.id]: updatedProgress }));
      }

      toast({
        title: t('module.quizCompleted'),
        description: `${t('module.youScored')} ${result.percentage}%`,
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('toast.error'),
        description: 'Failed to submit quiz',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    const progress = currentTopic ? topicProgress[currentTopic.id] : undefined;
    if ((progress?.quiz_attempts || 0) >= 2) {
      toast({ variant: 'destructive', title: t('module.noRetriesLeft'), description: t('module.retryOnce') });
      return;
    }
    setAnswers({});
    setShowResults(false);
    setQuizResults([]);
    setCurrentStep(2);
  };

  const handleTopicChange = (nextIndex: number) => {
    setCurrentTopicIndex(nextIndex);
    setAnswers({});
    setShowResults(false);
    setQuizResults([]);
  };

  const getVideoEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
    if (url.includes('vimeo.com')) {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold mb-4">{t('module.moduleNotFound')}</h1>
          <Button asChild><Link to="/app">{t('module.backToDashboard')}</Link></Button>
        </div>
      </div>
    );
  }

  const title = getLocalizedContent(module.title_sv, module.title_en);
  const moduleDescription = getLocalizedContent(module.description_sv, module.description_en);
  const moduleIntro = getLocalizedContent(module.read_content_sv, module.read_content_en);
  const topicTitle = currentTopic ? getLocalizedContent(currentTopic.title_sv, currentTopic.title_en) : '';
  const topicDescription = currentTopic ? getLocalizedContent(currentTopic.description_sv, currentTopic.description_en) : '';
  const topicContent = currentTopic ? getLocalizedContent(currentTopic.read_content_sv, currentTopic.read_content_en) : '';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/app" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t('module.backToDashboard')}
          </Link>
          <LanguageToggle />
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl space-y-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">{title}</h1>
          {moduleDescription && <p className="text-muted-foreground">{moduleDescription}</p>}
        </div>

        {(moduleIntro || moduleDescription) && (
          <section className="glass-card rounded-2xl p-6 md:p-8 space-y-4">
            <h2 className="font-display text-xl font-semibold">{t('module.moduleIntro')}</h2>
            {moduleIntro ? (
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown>{moduleIntro}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{moduleDescription}</p>
            )}
          </section>
        )}

        {topics.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground">
            {t('module.noTopics')}
          </div>
        ) : (
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('module.topic')} {currentTopicIndex + 1} / {topics.length}</p>
                <h2 className="font-display text-xl font-semibold">{topicTitle}</h2>
                {topicDescription && <p className="text-sm text-muted-foreground">{topicDescription}</p>}
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  disabled={currentTopicIndex === 0}
                  onClick={() => handleTopicChange(currentTopicIndex - 1)}
                >
                  {t('module.previousTopic')}
                </Button>
                <Button
                  variant="outline"
                  disabled={currentTopicIndex >= topics.length - 1}
                  onClick={() => handleTopicChange(currentTopicIndex + 1)}
                >
                  {t('module.nextTopic')}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-10 relative">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-border -z-10" />
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`progress-step ${index < currentStep ? 'completed' : index === currentStep ? 'active' : 'pending'}`}>
                    {index < currentStep ? <CheckCircle2 className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                  </div>
                  <span className="text-xs mt-2 text-muted-foreground">{step.label}</span>
                </div>
              ))}
            </div>

            <div className="glass-card rounded-2xl p-6 md:p-8">
              {currentStep === 0 && (
                <div className="prose prose-slate max-w-none">
                  <ReactMarkdown>{topicContent}</ReactMarkdown>
                  <div className="mt-8 pt-6 border-t border-border">
                    <Button variant="hero" onClick={handleReadComplete}>
                      {t('module.markAsComplete')} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div>
                  <h2 className="font-display text-xl font-semibold mb-4">{t('module.watchTheVideo')}</h2>
                  <div className="aspect-video rounded-xl overflow-hidden bg-muted mb-6">
                    {currentTopic?.video_url ? (
                      <iframe src={getVideoEmbedUrl(currentTopic.video_url)} className="w-full h-full" allowFullScreen />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                        {t('module.watchTheVideo')}
                      </div>
                    )}
                  </div>
                  <Button variant="hero" onClick={handleWatchComplete}>
                    {t('module.markAsComplete')} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              {currentStep === 2 && !showResults && (
                <div>
                  <h2 className="font-display text-xl font-semibold mb-6">{t('module.takeTheQuiz')}</h2>
                  {questions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('module.noQuizQuestions')}</p>
                  ) : (
                    <div className="space-y-8">
                      {questions.map((q, idx) => (
                        <div key={q.id} className="p-4 bg-secondary/30 rounded-xl">
                          <p className="font-medium mb-4">{idx + 1}. {q.question_text}</p>
                          <div className="space-y-2">
                            {q.options.map((opt, optIdx) => (
                              <label key={optIdx} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${answers[q.id] === optIdx ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-accent'} border`}>
                                <input type="radio" name={q.id} checked={answers[q.id] === optIdx} onChange={() => setAnswers({ ...answers, [q.id]: optIdx })} className="accent-primary" />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-8">
                    <Button variant="hero" onClick={handleSubmitQuiz} disabled={questions.length === 0 || Object.keys(answers).length < questions.length || submitting}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {t('module.submitQuiz')}
                    </Button>
                  </div>
                </div>
              )}

              {(currentStep === 3 || showResults) && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                    <Trophy className="h-10 w-10 text-success" />
                  </div>
                  <h2 className="font-display text-2xl font-bold mb-2">{t('module.topicComplete')}</h2>
                  <p className="text-muted-foreground mb-4">{t('module.yourScore')} {topicProgress[currentTopic?.id || '']?.latest_score || quizScore}%</p>
                  <p className="text-sm text-muted-foreground mb-6">{t('module.bestScore')} {topicProgress[currentTopic?.id || '']?.best_score}%</p>

                  {quizResults.length > 0 && (
                    <div className="space-y-4 text-left max-w-xl mx-auto mb-8">
                      {quizResults.map((q, idx) => (
                        <div key={q.question_id} className="p-4 bg-secondary/30 rounded-xl">
                          <p className="font-medium mb-2">{idx + 1}. {q.question_text}</p>
                          <p className="text-sm text-success">{t('module.correct')} {q.options[q.correct_index]}</p>
                          {q.explanation && <p className="text-sm text-muted-foreground mt-1">{q.explanation}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 justify-center">
                    {(topicProgress[currentTopic?.id || '']?.quiz_attempts || 0) < 2 && (
                      <Button variant="outline" onClick={handleRetry}>{t('module.retryQuiz')}</Button>
                    )}
                    {currentTopicIndex < topics.length - 1 && (
                      <Button variant="hero" onClick={() => handleTopicChange(currentTopicIndex + 1)}>
                        {t('module.nextTopic')} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" asChild><Link to="/app">{t('module.backToDashboard')}</Link></Button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default ModulePage;
