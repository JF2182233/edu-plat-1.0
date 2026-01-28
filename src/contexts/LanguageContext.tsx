import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'sv' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  sv: {
    // Landing
    'landing.title1': 'Utveckla Nya Färdigheter med',
    'landing.title2': 'Interaktivt Lärande',
    'landing.subtitle': 'Genomför introduktionsmoduler i din egen takt. Läs, titta, testa och följ din progress — allt i en vacker plattform.',
    'landing.startLearning': 'Börja Lära',
    'landing.haveAccount': 'Jag har ett konto',
    'landing.signIn': 'Logga In',
    'landing.getStarted': 'Kom Igång',
    'landing.howItWorks': 'Så Fungerar Det',
    'landing.howItWorksDesc': 'Vår strukturerade metod hjälper dig lära effektivt och behålla kunskapen bättre.',
    'landing.readLearn': 'Läs & Lär',
    'landing.readLearnDesc': 'Fördjupa dig i omfattande innehåll med rik text och tydliga förklaringar.',
    'landing.watchVideos': 'Titta på Videor',
    'landing.watchVideosDesc': 'Visuellt lärande genom kuraterat videoinnehåll från experter.',
    'landing.takeQuizzes': 'Genomför Quiz',
    'landing.takeQuizzesDesc': 'Testa din förståelse med interaktiva quiz och få direkt feedback.',
    'landing.trackProgress': 'Följ Progress',
    'landing.trackProgressDesc': 'Följ dina framsteg och fortsätt precis där du slutade.',
    'landing.readyToStart': 'Redo att Börja Din Resa?',
    'landing.joinThousands': 'Gå med tusentals lärande som redan bemästrar nya färdigheter med vår plattform.',
    'landing.createFreeAccount': 'Skapa konto',
    'landing.footer': 'SP Onboarding. Byggd med omsorg.',
    
    // Auth
    'auth.backToHome': 'Tillbaka till startsidan',
    'auth.welcomeBack': 'Välkommen tillbaka',
    'auth.signInContinue': 'Logga in för att fortsätta din läranderesa.',
    'auth.email': 'E-post',
    'auth.password': 'Lösenord',
    'auth.forgotPassword': 'Glömt lösenord?',
    'auth.signInBtn': 'Logga In',
    'auth.signingIn': 'Loggar in...',
    'auth.noAccount': 'Har du inget konto?',
    'auth.createOne': 'Skapa ett',
    'auth.continueYourLearning': 'Fortsätt Ditt Lärande',
    'auth.pickUpWhereYouLeft': 'Fortsätt precis där du slutade och fortsätt göra framsteg mot dina mål.',
    'auth.startYourJourney': 'Börja Din Resa',
    'auth.createAccountBegin': 'Skapa ett konto och börja bemästra nya färdigheter med vår interaktiva plattform.',
    'auth.createYourAccount': 'Skapa ditt konto',
    'auth.getStartedToday': 'Kom igång med din läranderesa idag.',
    'auth.fullName': 'Fullständigt Namn',
    'auth.confirmPassword': 'Bekräfta Lösenord',
    'auth.createAccount': 'Skapa Konto',
    'auth.creatingAccount': 'Skapar konto...',
    'auth.alreadyHaveAccount': 'Har du redan ett konto?',
    'auth.signInLink': 'Logga in',
    'auth.resetPassword': 'Återställ ditt lösenord',
    'auth.resetInstructions': 'Ange din e-post så skickar vi instruktioner för att återställa ditt lösenord.',
    'auth.sendResetInstructions': 'Skicka Återställningsinstruktioner',
    'auth.sending': 'Skickar...',
    'auth.checkYourEmail': 'Kolla din e-post',
    'auth.sentInstructionsTo': 'Vi har skickat instruktioner för att återställa lösenordet till',
    'auth.backToLogin': 'Tillbaka till inloggning',
    'auth.setNewPassword': 'Ange nytt lösenord',
    'auth.setNewPasswordDescription': 'Välj ett nytt lösenord för ditt konto.',
    'auth.newPassword': 'Nytt lösenord',
    'auth.confirmNewPassword': 'Bekräfta nytt lösenord',
    'auth.updatePassword': 'Uppdatera Lösenord',
    'auth.updating': 'Uppdaterar...',
    'auth.passwordUpdated': 'Lösenord uppdaterat!',
    'auth.passwordUpdatedDescription': 'Ditt lösenord har ändrats. Du kan nu logga in med ditt nya lösenord.',
    'auth.invalidResetLink': 'Ogiltig eller utgången återställningslänk. Begär en ny.',
    'validation.passwordsMatch': 'Lösenorden matchar inte',
    
    // Validation
    'validation.validEmail': 'Ange en giltig e-postadress',
    'validation.passwordRequired': 'Lösenord krävs',
    'validation.nameMin': 'Namnet måste vara minst 2 tecken',
    'validation.nameTooLong': 'Namnet är för långt',
    'validation.passwordMin': 'Lösenordet måste vara minst 6 tecken',
    'validation.passwordsDontMatch': 'Lösenorden matchar inte',
    
    // Toast messages
    'toast.signInFailed': 'Inloggning misslyckades',
    'toast.invalidCredentials': 'Ogiltig e-post eller lösenord. Försök igen.',
    'toast.welcomeBack': 'Välkommen tillbaka!',
    'toast.signedInSuccessfully': 'Du har loggat in.',
    'toast.registrationFailed': 'Registrering misslyckades',
    'toast.alreadyRegistered': 'Denna e-post är redan registrerad. Logga in istället.',
    'toast.accountCreated': 'Konto skapat!',
    'toast.welcomeAboard': 'Välkommen ombord! Omdirigerar till din dashboard...',
    'toast.error': 'Fel',
    'toast.emailSent': 'E-post skickad!',
    'toast.checkInbox': 'Kolla din inkorg för instruktioner om lösenordsåterställning.',
    'toast.success': 'Lyckades',
    
    // Dashboard
    'dashboard.welcomeBack': 'Välkommen tillbaka',
    'dashboard.continueJourney': 'Fortsätt din läranderesa. Fortsätt där du slutade.',
    'dashboard.admin': 'Admin',
    'dashboard.profile': 'Profil',
    'dashboard.logout': 'Logga ut',
    'dashboard.noModulesAvailable': 'Inga moduler tillgängliga',
    'dashboard.checkBackLater': 'Kom tillbaka senare för nytt lärinnehåll.',
    'dashboard.progress': 'Progress',
    'dashboard.lastActivity': 'Senaste aktivitet',
    'dashboard.startModule': 'Starta Modul',
    'dashboard.continue': 'Fortsätt',
    'dashboard.review': 'Granska',
    
    // Module Page
    'module.backToDashboard': 'Tillbaka till Dashboard',
    'module.read': 'Läs',
    'module.watch': 'Titta',
    'module.quiz': 'Quiz',
    'module.done': 'Klart',
    'module.markAsComplete': 'Markera som Klar',
    'module.watchTheVideo': 'Titta på Videon',
    'module.takeTheQuiz': 'Genomför Quizet',
    'module.submitQuiz': 'Skicka Quiz',
    'module.moduleComplete': 'Modul Klar!',
    'module.yourScore': 'Ditt resultat:',
    'module.bestScore': 'Bästa resultat:',
    'module.correct': 'Rätt:',
    'module.retryQuiz': 'Gör Om Quiz',
    'module.moduleNotFound': 'Modulen hittades inte',
    'module.quizCompleted': 'Quiz genomfört!',
    'module.youScored': 'Du fick',
    'module.noRetriesLeft': 'Inga omförsök kvar',
    'module.retryOnce': 'Du kan bara göra om quizet en gång.',
    
    // Profile
    'profile.title': 'Profil',
    'profile.displayName': 'Visningsnamn',
    'profile.saveChanges': 'Spara Ändringar',
    'profile.saving': 'Sparar...',
    'profile.signOut': 'Logga Ut',
    'profile.updated': 'Profil uppdaterad',
    'profile.updatedDesc': 'Din profil har uppdaterats.',
    
    // Admin
    'admin.backToApp': 'Tillbaka till Appen',
    'admin.adminPanel': 'Admin Panel',
    'admin.adminDashboard': 'Admin Dashboard',
    'admin.manageModules': 'Hantera Moduler',
    'admin.manageModulesDesc': 'Skapa, redigera och hantera introduktionsmoduler och quiz-frågor.',
    'admin.viewUsers': 'Visa Användare',
    'admin.viewUsersDesc': 'Visa alla användare och deras progress på introduktionsmoduler.',
    'admin.backToAdmin': 'Tillbaka till Admin',
    'admin.newModule': 'Ny Modul',
    'admin.modules': 'Moduler',
    'admin.noModulesYet': 'Inga moduler ännu. Skapa en för att komma igång.',
    'admin.draft': 'Utkast',
    'admin.back': 'Tillbaka',
    'admin.save': 'Spara',
    'admin.moduleDetails': 'Moduldetaljer',
    'admin.title': 'Titel',
    'admin.description': 'Beskrivning',
    'admin.readContentMarkdown': 'Lästinnehåll (Markdown)',
    'admin.videoUrl': 'Video URL',
    'admin.published': 'Publicerad',
    'admin.moduleVisibility': 'Modulens synlighet',
    'admin.moduleVisibilityDesc': 'Styr vilka användare som kan se denna modul. Om ingen är vald syns modulen för alla.',
    'admin.restrictToUsers': 'Begränsa till användare',
    'admin.quizQuestions': 'Quiz-frågor',
    'admin.add': 'Lägg till',
    'admin.question': 'Fråga',
    'admin.explanationOptional': 'Förklaring (valfritt)',
    'admin.savedSuccessfully': 'Sparad',
    'admin.moduleCreated': 'Modul skapad',
    'admin.moduleDeleted': 'Modul raderad',
    'admin.questionDeleted': 'Fråga raderad',
    'admin.users': 'Användare',
    'admin.noUsersYet': 'Inga användare ännu.',
    'admin.unnamedUser': 'Namnlös Användare',
  },
  en: {
    // Landing
    'landing.title1': 'Master New Skills with',
    'landing.title2': 'Interactive Learning',
    'landing.subtitle': 'Complete onboarding modules at your own pace. Read, watch, quiz, and track your progress — all in one beautiful platform.',
    'landing.startLearning': 'Start Learning',
    'landing.haveAccount': 'I have an account',
    'landing.signIn': 'Sign In',
    'landing.getStarted': 'Get Started',
    'landing.howItWorks': 'How It Works',
    'landing.howItWorksDesc': 'Our structured approach helps you learn effectively and retain knowledge better.',
    'landing.readLearn': 'Read & Learn',
    'landing.readLearnDesc': 'Dive into comprehensive content with rich text and clear explanations.',
    'landing.watchVideos': 'Watch Videos',
    'landing.watchVideosDesc': 'Visual learning through curated video content from experts.',
    'landing.takeQuizzes': 'Take Quizzes',
    'landing.takeQuizzesDesc': 'Test your understanding with interactive quizzes and get instant feedback.',
    'landing.trackProgress': 'Track Progress',
    'landing.trackProgressDesc': 'Monitor your achievements and pick up right where you left off.',
    'landing.readyToStart': 'Ready to Start Your Journey?',
    'landing.joinThousands': 'Join thousands of learners who are already mastering new skills with our platform.',
    'landing.createFreeAccount': 'Create account',
    'landing.footer': 'Onboarding. Built with care.',
    
    // Auth
    'auth.backToHome': 'Back to home',
    'auth.welcomeBack': 'Welcome back',
    'auth.signInContinue': 'Sign in to continue your learning journey.',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.forgotPassword': 'Forgot password?',
    'auth.signInBtn': 'Sign In',
    'auth.signingIn': 'Signing in...',
    'auth.noAccount': "Don't have an account?",
    'auth.createOne': 'Create one',
    'auth.continueYourLearning': 'Continue Your Learning',
    'auth.pickUpWhereYouLeft': 'Pick up right where you left off and keep making progress on your goals.',
    'auth.startYourJourney': 'Start Your Journey',
    'auth.createAccountBegin': 'Create an account and begin mastering new skills with our interactive learning platform.',
    'auth.createYourAccount': 'Create your account',
    'auth.getStartedToday': 'Get started with your learning journey today.',
    'auth.fullName': 'Full Name',
    'auth.confirmPassword': 'Confirm Password',
    'auth.createAccount': 'Create Account',
    'auth.creatingAccount': 'Creating account...',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.signInLink': 'Sign in',
    'auth.resetPassword': 'Reset your password',
    'auth.resetInstructions': "Enter your email and we'll send you instructions to reset your password.",
    'auth.sendResetInstructions': 'Send Reset Instructions',
    'auth.sending': 'Sending...',
    'auth.checkYourEmail': 'Check your email',
    'auth.sentInstructionsTo': "We've sent password reset instructions to",
    'auth.backToLogin': 'Back to login',
    'auth.setNewPassword': 'Set new password',
    'auth.setNewPasswordDescription': 'Choose a new password for your account.',
    'auth.newPassword': 'New Password',
    'auth.confirmNewPassword': 'Confirm New Password',
    'auth.updatePassword': 'Update Password',
    'auth.updating': 'Updating...',
    'auth.passwordUpdated': 'Password updated!',
    'auth.passwordUpdatedDescription': 'Your password has been changed. You can now sign in with your new password.',
    'auth.invalidResetLink': 'Invalid or expired reset link. Please request a new one.',
    'validation.passwordsMatch': "Passwords don't match",
    
    // Validation
    'validation.validEmail': 'Please enter a valid email address',
    'validation.passwordRequired': 'Password is required',
    'validation.nameMin': 'Name must be at least 2 characters',
    'validation.nameTooLong': 'Name is too long',
    'validation.passwordMin': 'Password must be at least 6 characters',
    'validation.passwordsDontMatch': "Passwords don't match",
    
    // Toast messages
    'toast.signInFailed': 'Sign in failed',
    'toast.invalidCredentials': 'Invalid email or password. Please try again.',
    'toast.welcomeBack': 'Welcome back!',
    'toast.signedInSuccessfully': 'You have successfully signed in.',
    'toast.registrationFailed': 'Registration failed',
    'toast.alreadyRegistered': 'This email is already registered. Please sign in instead.',
    'toast.accountCreated': 'Account created!',
    'toast.welcomeAboard': 'Welcome aboard! Redirecting to your dashboard...',
    'toast.error': 'Error',
    'toast.emailSent': 'Email sent!',
    'toast.checkInbox': 'Check your inbox for password reset instructions.',
    'toast.success': 'Success',
    
    // Dashboard
    'dashboard.welcomeBack': 'Welcome back',
    'dashboard.continueJourney': 'Continue your learning journey. Pick up where you left off.',
    'dashboard.admin': 'Admin',
    'dashboard.profile': 'Profile',
    'dashboard.logout': 'Logout',
    'dashboard.noModulesAvailable': 'No modules available',
    'dashboard.checkBackLater': 'Check back later for new learning content.',
    'dashboard.progress': 'Progress',
    'dashboard.lastActivity': 'Last activity',
    'dashboard.startModule': 'Start Module',
    'dashboard.continue': 'Continue',
    'dashboard.review': 'Review',
    
    // Module Page
    'module.backToDashboard': 'Back to Dashboard',
    'module.read': 'Read',
    'module.watch': 'Watch',
    'module.quiz': 'Quiz',
    'module.done': 'Done',
    'module.markAsComplete': 'Mark as Complete',
    'module.watchTheVideo': 'Watch the Video',
    'module.takeTheQuiz': 'Take the Quiz',
    'module.submitQuiz': 'Submit Quiz',
    'module.moduleComplete': 'Module Complete!',
    'module.yourScore': 'Your score:',
    'module.bestScore': 'Best score:',
    'module.correct': 'Correct:',
    'module.retryQuiz': 'Retry Quiz',
    'module.moduleNotFound': 'Module not found',
    'module.quizCompleted': 'Quiz completed!',
    'module.youScored': 'You scored',
    'module.noRetriesLeft': 'No retries left',
    'module.retryOnce': 'You can only retry the quiz once.',
    
    // Profile
    'profile.title': 'Profile',
    'profile.displayName': 'Display Name',
    'profile.saveChanges': 'Save Changes',
    'profile.saving': 'Saving...',
    'profile.signOut': 'Sign Out',
    'profile.updated': 'Profile updated',
    'profile.updatedDesc': 'Your profile has been updated successfully.',
    
    // Admin
    'admin.backToApp': 'Back to App',
    'admin.adminPanel': 'Admin Panel',
    'admin.adminDashboard': 'Admin Dashboard',
    'admin.manageModules': 'Manage Modules',
    'admin.manageModulesDesc': 'Create, edit, and manage onboarding modules and quiz questions.',
    'admin.viewUsers': 'View Users',
    'admin.viewUsersDesc': 'View all users and their progress on onboarding modules.',
    'admin.backToAdmin': 'Back to Admin',
    'admin.newModule': 'New Module',
    'admin.modules': 'Modules',
    'admin.noModulesYet': 'No modules yet. Create one to get started.',
    'admin.draft': 'Draft',
    'admin.back': 'Back',
    'admin.save': 'Save',
    'admin.moduleDetails': 'Module Details',
    'admin.title': 'Title',
    'admin.description': 'Description',
    'admin.readContentMarkdown': 'Read Content (Markdown)',
    'admin.videoUrl': 'Video URL',
    'admin.published': 'Published',
    'admin.moduleVisibility': 'Module visibility',
    'admin.moduleVisibilityDesc': 'Control which users can see this module. If no one is selected, the module is visible to everyone.',
    'admin.restrictToUsers': 'Restrict to users',
    'admin.quizQuestions': 'Quiz Questions',
    'admin.add': 'Add',
    'admin.question': 'Question',
    'admin.explanationOptional': 'Explanation (optional)',
    'admin.savedSuccessfully': 'Saved successfully',
    'admin.moduleCreated': 'Module created',
    'admin.moduleDeleted': 'Module deleted',
    'admin.questionDeleted': 'Question deleted',
    'admin.users': 'Users',
    'admin.noUsersYet': 'No users yet.',
    'admin.unnamedUser': 'Unnamed User',
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'sv';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
