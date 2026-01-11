import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Users } from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';

const AdminDashboard = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/app" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />{t('admin.backToApp')}
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <span className="font-display font-bold text-foreground">{t('admin.adminPanel')}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-bold mb-8">{t('admin.adminDashboard')}</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Link to="/admin/modules" className="glass-card rounded-2xl p-6 hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h2 className="font-display text-xl font-semibold mb-2">{t('admin.manageModules')}</h2>
            <p className="text-muted-foreground">{t('admin.manageModulesDesc')}</p>
          </Link>
          
          <Link to="/admin/users" className="glass-card rounded-2xl p-6 hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h2 className="font-display text-xl font-semibold mb-2">{t('admin.viewUsers')}</h2>
            <p className="text-muted-foreground">{t('admin.viewUsersDesc')}</p>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
