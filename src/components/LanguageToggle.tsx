import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

export const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === 'sv' ? 'en' : 'sv')}
      className="font-medium text-xs px-2 py-1 h-8"
    >
      <span className={language === 'sv' ? 'font-bold' : 'opacity-50'}>SV</span>
      <span className="mx-1 opacity-30">|</span>
      <span className={language === 'en' ? 'font-bold' : 'opacity-50'}>EN</span>
    </Button>
  );
};
