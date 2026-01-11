import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, Video, CheckCircle2, Award, ArrowRight } from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';

const Landing = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent via-background to-background" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        
        <nav className="relative z-10 container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/singelportalen-logo.svg"
              alt="Singelportalen logo"
              className="h-10 w-auto"
            />
            <span className="font-display text-xl font-bold text-foreground">Onboarding</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Button variant="ghost" asChild>
              <Link to="/login">{t('landing.signIn')}</Link>
            </Button>
            <Button variant="hero" asChild>
              <Link to="/register">{t('landing.getStarted')}</Link>
            </Button>
          </div>
        </nav>

        <div className="relative z-10 container mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-6 animate-slide-up">
              {t('landing.title1')}{' '}
              <span className="gradient-text">{t('landing.title2')}</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {t('landing.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Button variant="hero" size="xl" asChild>
                <Link to="/register">
                  {t('landing.startLearning')} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/login">{t('landing.haveAccount')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('landing.howItWorks')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('landing.howItWorksDesc')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: BookOpen,
                titleKey: 'landing.readLearn',
                descKey: 'landing.readLearnDesc',
              },
              {
                icon: Video,
                titleKey: 'landing.watchVideos',
                descKey: 'landing.watchVideosDesc',
              },
              {
                icon: CheckCircle2,
                titleKey: 'landing.takeQuizzes',
                descKey: 'landing.takeQuizzesDesc',
              },
              {
                icon: Award,
                titleKey: 'landing.trackProgress',
                descKey: 'landing.trackProgressDesc',
              },
            ].map((feature, index) => (
              <div
                key={feature.titleKey}
                className="glass-card rounded-2xl p-6 hover:shadow-xl transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t(feature.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-6">
          <div className="glass-card rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                {t('landing.readyToStart')}
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                {t('landing.joinThousands')}
              </p>
              <Button variant="hero" size="xl" asChild>
                <Link to="/register">
                  {t('landing.createFreeAccount')} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} {t('landing.footer')}</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
