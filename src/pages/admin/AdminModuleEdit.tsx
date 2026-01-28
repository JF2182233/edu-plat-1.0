import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Save, Loader2, GripVertical } from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface Module {
  id: string;
  title_sv: string;
  title_en: string;
  description_sv: string;
  description_en: string;
  read_content_sv: string;
  read_content_en: string;
  is_published: boolean;
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

interface Question {
  id: string;
  topic_id: string;
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  sort_order: number;
}

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
}

const AdminModuleEdit = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [module, setModule] = useState<Module | null>(null);
  const [topics, setTopics] = useState<ModuleTopic[]>([]);
  const [topicQuestions, setTopicQuestions] = useState<Record<string, Question[]>>({});
  const [removedTopicIds, setRemovedTopicIds] = useState<Set<string>>(new Set());
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [accessUserIds, setAccessUserIds] = useState<Set<string>>(new Set());
  const [initialAccessUserIds, setInitialAccessUserIds] = useState<Set<string>>(new Set());
  const [restrictAccess, setRestrictAccess] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      const [moduleRes, topicsRes, questionsRes, profilesRes, accessRes] = await Promise.all([
        supabase.from('modules').select('*').eq('id', id).single(),
        supabase.from('module_topics').select('*').eq('module_id', id).order('sort_order'),
        supabase.from('questions').select('*').eq('module_id', id).order('sort_order'),
        supabase.from('profiles').select('id, email, display_name').order('email'),
        supabase.from('module_access').select('user_id').eq('module_id', id),
      ]);

      if (moduleRes.data) setModule(moduleRes.data);
      if (topicsRes.data) setTopics(topicsRes.data);
      if (questionsRes.data) {
        const grouped: Record<string, Question[]> = {};
        questionsRes.data.forEach((q) => {
          const topicId = q.topic_id as string;
          if (!grouped[topicId]) grouped[topicId] = [];
          grouped[topicId].push({
            ...q,
            topic_id: topicId,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
          });
        });
        setTopicQuestions(grouped);
      }
      if (profilesRes.data) setProfiles(profilesRes.data);
      if (accessRes.data) {
        const ids = new Set(accessRes.data.map((entry) => entry.user_id));
        setAccessUserIds(ids);
        setInitialAccessUserIds(ids);
        setRestrictAccess(ids.size > 0);
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handleSave = async () => {
    if (!module || !id) return;
    setSaving(true);

    await supabase.from('modules').update({
      title_sv: module.title_sv,
      title_en: module.title_en,
      description_sv: module.description_sv,
      description_en: module.description_en,
      read_content_sv: module.read_content_sv,
      read_content_en: module.read_content_en,
      is_published: module.is_published,
    }).eq('id', id);

    const topicsToSave = topics.map((topic, index) => ({
      ...topic,
      module_id: id,
      sort_order: index,
    }));

    if (topicsToSave.length > 0) {
      await supabase.from('module_topics').upsert(topicsToSave);
    }

    if (removedTopicIds.size > 0) {
      await supabase.from('module_topics').delete().in('id', [...removedTopicIds]);
      setRemovedTopicIds(new Set());
    }

    for (const topic of topicsToSave) {
      const questions = topicQuestions[topic.id] || [];
      for (const [index, q] of questions.entries()) {
        await supabase.from('questions').upsert({
          id: q.id,
          module_id: id,
          topic_id: topic.id,
          question_text: q.question_text,
          options: JSON.stringify(q.options),
          correct_index: q.correct_index,
          explanation: q.explanation,
          sort_order: index,
        });
      }
    }

    const desiredIds = restrictAccess ? accessUserIds : new Set<string>();
    const idsToAdd = [...desiredIds].filter((userId) => !initialAccessUserIds.has(userId));
    const idsToRemove = [...initialAccessUserIds].filter((userId) => !desiredIds.has(userId));

    if (!restrictAccess) {
      await supabase.from('module_access').delete().eq('module_id', id);
    } else {
      if (idsToRemove.length > 0) {
        await supabase.from('module_access').delete().eq('module_id', id).in('user_id', idsToRemove);
      }
      if (idsToAdd.length > 0) {
        await supabase.from('module_access').insert(idsToAdd.map((userId) => ({ module_id: id, user_id: userId })));
      }
    }

    setInitialAccessUserIds(new Set(desiredIds));

    toast({ title: t('admin.savedSuccessfully') });
    setSaving(false);
  };

  const addTopic = () => {
    if (!id) return;
    const newTopic: ModuleTopic = {
      id: crypto.randomUUID(),
      module_id: id,
      title_sv: `${t('module.topic')} ${topics.length + 1}`,
      title_en: `Topic ${topics.length + 1}`,
      description_sv: '',
      description_en: '',
      read_content_sv: '',
      read_content_en: '',
      video_url: '',
      sort_order: topics.length,
    };
    setTopics([...topics, newTopic]);
  };

  const deleteTopic = async (topicId: string) => {
    setTopics(topics.filter((topic) => topic.id !== topicId));
    setRemovedTopicIds((prev) => new Set(prev).add(topicId));
    setTopicQuestions((prev) => {
      const next = { ...prev };
      delete next[topicId];
      return next;
    });
  };

  const updateTopic = (topicId: string, updates: Partial<ModuleTopic>) => {
    setTopics((prev) => prev.map((topic) => topic.id === topicId ? { ...topic, ...updates } : topic));
  };

  const addQuestion = (topicId: string) => {
    const nextQuestions = topicQuestions[topicId] || [];
    setTopicQuestions({
      ...topicQuestions,
      [topicId]: [...nextQuestions, {
        id: crypto.randomUUID(),
        topic_id: topicId,
        question_text: 'New question?',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correct_index: 0,
        explanation: '',
        sort_order: nextQuestions.length,
      }],
    });
  };

  const deleteQuestion = async (topicId: string, qId: string) => {
    await supabase.from('questions').delete().eq('id', qId);
    setTopicQuestions((prev) => ({
      ...prev,
      [topicId]: (prev[topicId] || []).filter((q) => q.id !== qId),
    }));
    toast({ title: t('admin.questionDeleted') });
  };

  const updateQuestion = (topicId: string, qId: string, updates: Partial<Question>) => {
    setTopicQuestions((prev) => ({
      ...prev,
      [topicId]: (prev[topicId] || []).map((q) => q.id === qId ? { ...q, ...updates } : q),
    }));
  };

  const toggleAccessUser = (userId: string) => {
    const next = new Set(accessUserIds);
    if (next.has(userId)) {
      next.delete(userId);
    } else {
      next.add(userId);
    }
    setAccessUserIds(next);
  };

  const handleRestrictAccessChange = (checked: boolean) => {
    setRestrictAccess(checked);
    if (!checked) {
      setAccessUserIds(new Set());
    }
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, topicId: string) => {
    event.dataTransfer.setData('text/plain', topicId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>, topicId: string) => {
    event.preventDefault();
    setDragOverId(topicId);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, topicId: string) => {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === topicId) return;

    const nextTopics = [...topics];
    const draggedIndex = nextTopics.findIndex((topic) => topic.id === draggedId);
    const targetIndex = nextTopics.findIndex((topic) => topic.id === topicId);
    if (draggedIndex === -1 || targetIndex === -1) return;

    const [removed] = nextTopics.splice(draggedIndex, 1);
    nextTopics.splice(targetIndex, 0, removed);
    setTopics(nextTopics);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDragOverId(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!module) return <div className="min-h-screen flex items-center justify-center">{t('module.moduleNotFound')}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-sky-100/80">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/admin/modules" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />{t('admin.back')}
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}{t('admin.save')}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl space-y-8">
        <div className="glass-card rounded-2xl p-6 space-y-4 border border-amber-200/80 bg-gradient-to-br from-white via-amber-50 to-amber-100/70 shadow-2xl ring-1 ring-amber-200/70 border-t-4 border-t-amber-400">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold">{t('admin.moduleVisibility')}</h2>
              <p className="text-sm text-muted-foreground">{t('admin.moduleVisibilityDesc')}</p>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-amber-300/70 bg-amber-100/80 px-4 py-2 shadow-md">
              <Switch id="restrict-access" checked={restrictAccess} onCheckedChange={handleRestrictAccessChange} className="scale-125 data-[state=unchecked]:bg-muted/70 data-[state=checked]:bg-amber-500 data-[state=checked]:shadow-lg" />
              <Label htmlFor="restrict-access" className="cursor-pointer text-sm font-semibold text-foreground">{t('admin.restrictToUsers')}</Label>
            </div>
          </div>
          <ScrollArea className="h-52 rounded-xl border border-amber-200/70 bg-amber-50/70 shadow-inner">
            {profiles.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">{t('admin.noUsersYet')}</div>
            ) : (
              <div className="space-y-2 p-2">
                {profiles.map((profile) => {
                  const label = profile.display_name || profile.email || t('admin.unnamedUser');
                  return (
                    <label
                      key={profile.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-amber-200/70 bg-white p-4 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{label}</span>
                        <span className="text-xs text-muted-foreground">{profile.email}</span>
                      </div>
                      <Checkbox
                        checked={accessUserIds.has(profile.id)}
                        onCheckedChange={() => {
                          if (!restrictAccess) {
                            setRestrictAccess(true);
                          }
                          toggleAccessUser(profile.id);
                        }}
                        className="h-5 w-5 border-muted-foreground/60 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 data-[state=checked]:shadow-md"
                      />
                    </label>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-4 border border-sky-300/80 bg-gradient-to-br from-white via-sky-50 to-sky-100/80 shadow-2xl ring-2 ring-sky-200/80 border-t-4 border-t-sky-500">
          <h2 className="font-display text-xl font-semibold">{t('admin.moduleDetails')}</h2>

          <Tabs defaultValue="sv" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="sv">🇸🇪 Svenska</TabsTrigger>
              <TabsTrigger value="en">🇬🇧 English</TabsTrigger>
            </TabsList>

            <TabsContent value="sv" className="space-y-4">
              <div><Label>{t('admin.title')} (SV)</Label><Input value={module.title_sv} onChange={(e) => setModule({ ...module, title_sv: e.target.value })} /></div>
              <div><Label>{t('admin.description')} (SV)</Label><Textarea value={module.description_sv} onChange={(e) => setModule({ ...module, description_sv: e.target.value })} /></div>
              <div><Label>{t('admin.moduleIntroContent')} (SV)</Label><Textarea rows={8} value={module.read_content_sv} onChange={(e) => setModule({ ...module, read_content_sv: e.target.value })} /></div>
            </TabsContent>

            <TabsContent value="en" className="space-y-4">
              <div><Label>{t('admin.title')} (EN)</Label><Input value={module.title_en} onChange={(e) => setModule({ ...module, title_en: e.target.value })} /></div>
              <div><Label>{t('admin.description')} (EN)</Label><Textarea value={module.description_en} onChange={(e) => setModule({ ...module, description_en: e.target.value })} /></div>
              <div><Label>{t('admin.moduleIntroContent')} (EN)</Label><Textarea rows={8} value={module.read_content_en} onChange={(e) => setModule({ ...module, read_content_en: e.target.value })} /></div>
            </TabsContent>
          </Tabs>

          <div className="pt-4 border-t border-border space-y-4">
            <div className="flex items-center gap-3">
              <Switch checked={module.is_published} onCheckedChange={(c) => setModule({ ...module, is_published: c })} />
              <Label>{t('admin.published')}</Label>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-6 border border-emerald-300/80 bg-gradient-to-br from-white via-emerald-50 to-emerald-100/80 shadow-2xl ring-2 ring-emerald-200/80 border-t-4 border-t-emerald-500">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold">{t('admin.topics')}</h2>
              <p className="text-sm text-muted-foreground">{t('admin.dragToReorder')}</p>
            </div>
            <Button variant="outline" size="sm" onClick={addTopic}><Plus className="h-4 w-4 mr-2" />{t('admin.addTopic')}</Button>
          </div>

          <Accordion type="multiple" className="space-y-4">
            {topics.map((topic, idx) => {
              const questions = topicQuestions[topic.id] || [];
              const heading = `${t('admin.topicDetails')} ${idx + 1}`;
              const isDragOver = dragOverId === topic.id;

              return (
                <AccordionItem
                  key={topic.id}
                  value={topic.id}
                  className={`rounded-xl border ${isDragOver ? 'border-primary bg-primary/5' : 'border-border'} overflow-hidden`}
                  draggable
                  onDragStart={(event) => handleDragStart(event, topic.id)}
                  onDragOver={(event) => handleDragOver(event, topic.id)}
                  onDrop={(event) => handleDrop(event, topic.id)}
                  onDragEnd={handleDragEnd}
                >
                  <AccordionTrigger className="px-4">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span>{heading}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{t('module.topic')} {idx + 1}</span>
                        <Button variant="ghost" size="icon" onClick={() => deleteTopic(topic.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      <Tabs defaultValue="sv" className="w-full">
                        <TabsList className="mb-4">
                          <TabsTrigger value="sv">🇸🇪 Svenska</TabsTrigger>
                          <TabsTrigger value="en">🇬🇧 English</TabsTrigger>
                        </TabsList>

                        <TabsContent value="sv" className="space-y-4">
                          <div><Label>{t('admin.topicTitle')} (SV)</Label><Input value={topic.title_sv} onChange={(e) => updateTopic(topic.id, { title_sv: e.target.value })} /></div>
                          <div><Label>{t('admin.topicDescription')} (SV)</Label><Textarea value={topic.description_sv} onChange={(e) => updateTopic(topic.id, { description_sv: e.target.value })} /></div>
                          <div><Label>{t('admin.topicContentMarkdown')} (SV)</Label><Textarea rows={8} value={topic.read_content_sv} onChange={(e) => updateTopic(topic.id, { read_content_sv: e.target.value })} /></div>
                        </TabsContent>

                        <TabsContent value="en" className="space-y-4">
                          <div><Label>{t('admin.topicTitle')} (EN)</Label><Input value={topic.title_en} onChange={(e) => updateTopic(topic.id, { title_en: e.target.value })} /></div>
                          <div><Label>{t('admin.topicDescription')} (EN)</Label><Textarea value={topic.description_en} onChange={(e) => updateTopic(topic.id, { description_en: e.target.value })} /></div>
                          <div><Label>{t('admin.topicContentMarkdown')} (EN)</Label><Textarea rows={8} value={topic.read_content_en} onChange={(e) => updateTopic(topic.id, { read_content_en: e.target.value })} /></div>
                        </TabsContent>
                      </Tabs>

                      <div>
                        <Label>{t('admin.topicVideoUrl')}</Label>
                        <Input value={topic.video_url} onChange={(e) => updateTopic(topic.id, { video_url: e.target.value })} />
                      </div>

                      <div className="space-y-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between">
                          <h3 className="font-display text-lg font-semibold">{t('admin.quizQuestions')}</h3>
                          <Button variant="outline" size="sm" onClick={() => addQuestion(topic.id)}><Plus className="h-4 w-4 mr-2" />{t('admin.add')}</Button>
                        </div>

                        {questions.length === 0 ? (
                          <p className="text-sm text-muted-foreground">{t('admin.noQuestionsYet')}</p>
                        ) : (
                          questions.map((q, questionIndex) => (
                            <div key={q.id} className="p-4 bg-secondary/30 rounded-xl space-y-3">
                              <div className="flex items-start justify-between">
                                <span className="text-sm font-medium">{t('admin.question')} {questionIndex + 1}</span>
                                <Button variant="ghost" size="icon" onClick={() => deleteQuestion(topic.id, q.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </div>
                              <Input value={q.question_text} onChange={(e) => updateQuestion(topic.id, q.id, { question_text: e.target.value })} placeholder="Question text" />
                              <div className="grid gap-2">
                                {q.options.map((opt, optIdx) => (
                                  <div key={optIdx} className="flex items-center gap-2">
                                    <input type="radio" checked={q.correct_index === optIdx} onChange={() => updateQuestion(topic.id, q.id, { correct_index: optIdx })} />
                                    <Input value={opt} onChange={(e) => {
                                      const newOpts = [...q.options];
                                      newOpts[optIdx] = e.target.value;
                                      updateQuestion(topic.id, q.id, { options: newOpts });
                                    }} />
                                  </div>
                                ))}
                              </div>
                              <Input value={q.explanation || ''} onChange={(e) => updateQuestion(topic.id, q.id, { explanation: e.target.value })} placeholder={t('admin.explanationOptional')} />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          {topics.length === 0 && (
            <div className="rounded-xl border border-dashed border-muted-foreground/30 p-6 text-center text-sm text-muted-foreground">
              {t('admin.noTopicsYet')}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminModuleEdit;
