import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';

interface Module {
  id: string;
  title_sv: string;
  title_en: string;
  description_sv: string;
  description_en: string;
  is_published: boolean;
  sort_order: number;
}

const AdminModules = () => {
  const { t, language } = useLanguage();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getLocalizedContent = (sv: string, en: string) => language === 'en' ? en : sv;

  const fetchModules = async () => {
    const { data } = await supabase.from('modules').select('id, title_sv, title_en, description_sv, description_en, is_published, sort_order').order('sort_order');
    if (data) setModules(data);
    setLoading(false);
  };

  useEffect(() => { fetchModules(); }, []);

  const handleCreate = async () => {
    const { data, error } = await supabase.from('modules').insert({
      title_sv: 'Ny modul',
      title_en: 'New Module',
      description_sv: 'Modulbeskrivning',
      description_en: 'Module description',
      read_content_sv: '# Ny modul\n\nLägg till ditt innehåll här.',
      read_content_en: '# New Module\n\nAdd your content here.',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      is_published: false,
      sort_order: modules.length,
    }).select().single();
    
    if (error) toast({ variant: 'destructive', title: t('toast.error'), description: error.message });
    else if (data) {
      toast({ title: t('admin.moduleCreated') });
      fetchModules();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this module?')) return;
    const { error } = await supabase.from('modules').delete().eq('id', id);
    if (error) toast({ variant: 'destructive', title: t('toast.error'), description: error.message });
    else { toast({ title: t('admin.moduleDeleted') }); fetchModules(); }
  };

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from('modules').update({ is_published: !current }).eq('id', id);
    fetchModules();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />{t('admin.backToAdmin')}
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Button onClick={handleCreate}><Plus className="h-4 w-4 mr-2" />{t('admin.newModule')}</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-bold mb-8">{t('admin.modules')}</h1>
        
        {loading ? (
          <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl" />)}</div>
        ) : modules.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">{t('admin.noModulesYet')}</div>
        ) : (
          <div className="space-y-4">
            {modules.map((m) => (
              <div key={m.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{getLocalizedContent(m.title_sv, m.title_en)}</h3>
                    {!m.is_published && <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded">{t('admin.draft')}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">{getLocalizedContent(m.description_sv, m.description_en)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => togglePublish(m.id, m.is_published)}>
                    {m.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" asChild><Link to={`/admin/modules/${m.id}`}><Edit className="h-4 w-4" /></Link></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminModules;
