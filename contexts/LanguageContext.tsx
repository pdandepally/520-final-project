/**
 * Language context for managing translations
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Auth pages
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'auth.logout': 'Logout',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.fullName': 'Full Name',
    'auth.username': 'Username',
    'auth.birthdate': 'Date of Birth',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.noAccount': "Don't have an account?",
    'auth.loggingIn': 'Logging in...',
    'auth.signingUp': 'Signing up...',
    
    // Account types
    'account.worker': 'Worker',
    'account.employer': 'Employer',
    'account.accountType': 'Account Type',
    'account.workerDesc': 'Looking for work and want to showcase my experience',
    'account.employerDesc': 'Post jobs and find the best workers',
    
    // Worker Dashboard
    'worker.title': 'Worker Dashboard',
    'worker.subtitle': 'Find jobs and manage your work experience',
    'worker.availableJobs': 'Available Jobs',
    'worker.myExperience': 'My Work Experience',
    'worker.addExperience': 'Add Experience',
    'worker.noJobs': 'No jobs available at this time',
    'worker.noExperience': 'You haven\'t added any work experience',
    'worker.addFirst': 'Add your first job!',
    'worker.loading': 'Loading jobs...',
    
    // Employer Dashboard
    'employer.title': 'Employer Dashboard',
    'employer.subtitle': 'Post jobs and find the best workers',
    'employer.postNewJob': 'Post New Job',
    'employer.myJobs': 'My Posted Jobs',
    'employer.noJobs': 'You haven\'t posted any jobs',
    'employer.postFirst': 'Post your first job!',
    
    // Job form
    'job.title': 'Job Title',
    'job.description': 'Description',
    'job.location': 'Location',
    'job.payRate': 'Pay Rate',
    'job.requirements': 'Requirements',
    'job.startDate': 'Start Date',
    'job.endDate': 'End Date',
    'job.employer': 'Employer',
    'job.position': 'Position',
    'job.status': 'Status',
    'job.active': 'Active',
    'job.filled': 'Filled',
    'job.closed': 'Closed',
    'job.markFilled': 'Mark as Filled',
    'job.markClosed': 'Close',
    'job.reactivate': 'Reactivate',
    'job.workersNeeded': 'Workers Needed',
    'job.spotsAvailable': 'spots available',
    'job.spotsFilled': 'Full',
    'job.applyNow': 'Apply Now',
    'job.applied': 'Applied',
    'job.withdraw': 'Withdraw Application',
    'job.applications': 'Applications',
    
    // Common
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.create': 'Create',
    'common.loading': 'Loading...',
    'common.present': 'Present',
    'common.system': 'Worker Management System',
    'common.welcome': 'Welcome to Management System',
    'common.redirecting': 'Redirecting...',
    
    // Underage blocked page
    'underage.title': 'Age Restriction Notice',
    'underage.message': 'We appreciate your interest in our platform. However, you must be at least 18 years old to create an account and use our services.',
    'underage.emailSaved': 'Your email has been saved, and you will be able to register when you turn 18.',
    'underage.whyTitle': 'Why This Matters',
    'underage.whyContent': 'Child labor laws exist to protect young people from exploitation and ensure they can focus on education and development. These protections are important because:',
    'underage.reason1': 'Education is crucial for long-term success and opportunities',
    'underage.reason2': 'Young people need protection from unsafe working conditions',
    'underage.reason3': 'Fair labor standards prevent exploitation',
    'underage.reason4': 'International agreements protect children\'s rights worldwide',
    'underage.resourcesTitle': 'Learn More About Child Labor Protection',
    'underage.iloDesc': 'Global standards and information about child labor prevention',
    'underage.dolDesc': 'Mexican Ministry of Labor and Social Welfare - regulations and resources',
    'underage.unicefDesc': 'International child protection initiatives and information',
    'underage.clcDesc': 'Coalition working to end child labor worldwide',
    'underage.needHelpTitle': 'Need Help or Have Concerns?',
    'underage.needHelpContent': 'If you or someone you know is being exploited or forced to work in unsafe conditions, help is available:',
    'underage.nationalHotline': 'National Human Trafficking Hotline (Mexico)',
    'underage.textLine': 'STPS Information Line',
    'underage.textInfo': 'Call 800 911 7877 for labor rights',
    'underage.returnHome': 'Return to Home',
  },
  es: {
    // Auth pages
    'auth.login': 'Iniciar Sesión',
    'auth.signup': 'Registrarse',
    'auth.logout': 'Cerrar Sesión',
    'auth.email': 'Correo Electrónico',
    'auth.password': 'Contraseña',
    'auth.fullName': 'Nombre Completo',
    'auth.username': 'Nombre de Usuario',
    'auth.birthdate': 'Fecha de Nacimiento',
    'auth.alreadyHaveAccount': '¿Ya tienes cuenta?',
    'auth.noAccount': '¿No tienes cuenta?',
    'auth.loggingIn': 'Iniciando...',
    'auth.signingUp': 'Registrando...',
    
    // Account types
    'account.worker': 'Trabajador',
    'account.employer': 'Empleador',
    'account.accountType': 'Tipo de Cuenta',
    'account.workerDesc': 'Busco empleo y quiero mostrar mi experiencia',
    'account.employerDesc': 'Publico trabajos y busco trabajadores',
    
    // Worker Dashboard
    'worker.title': 'Panel de Trabajador',
    'worker.subtitle': 'Encuentra trabajos y gestiona tu experiencia laboral',
    'worker.availableJobs': 'Trabajos Disponibles',
    'worker.myExperience': 'Mi Experiencia Laboral',
    'worker.addExperience': 'Agregar Experiencia',
    'worker.noJobs': 'No hay trabajos disponibles en este momento',
    'worker.noExperience': 'No has agregado experiencia laboral',
    'worker.addFirst': '¡Agrega tu primer trabajo!',
    'worker.loading': 'Cargando trabajos...',
    
    // Employer Dashboard
    'employer.title': 'Panel de Empleador',
    'employer.subtitle': 'Publica trabajos y encuentra los mejores trabajadores',
    'employer.postNewJob': 'Publicar Nuevo Trabajo',
    'employer.myJobs': 'Mis Trabajos Publicados',
    'employer.noJobs': 'No has publicado trabajos',
    'employer.postFirst': '¡Publica tu primer trabajo!',
    
    // Job form
    'job.title': 'Título del Trabajo',
    'job.description': 'Descripción',
    'job.location': 'Ubicación',
    'job.payRate': 'Pago',
    'job.requirements': 'Requisitos',
    'job.startDate': 'Fecha de Inicio',
    'job.endDate': 'Fecha de Fin',
    'job.employer': 'Empleador',
    'job.position': 'Puesto',
    'job.status': 'Estado',
    'job.active': 'Activo',
    'job.filled': 'Lleno',
    'job.closed': 'Cerrado',
    'job.markFilled': 'Marcar como Lleno',
    'job.markClosed': 'Cerrar',
    'job.reactivate': 'Reactivar',
    'job.workersNeeded': 'Trabajadores Necesarios',
    'job.spotsAvailable': 'puestos disponibles',
    'job.spotsFilled': 'Lleno',
    'job.applyNow': 'Aplicar Ahora',
    'job.applied': 'Aplicado',
    'job.withdraw': 'Retirar Aplicación',
    'job.applications': 'Aplicaciones',
    
    // Common
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.add': 'Agregar',
    'common.create': 'Crear',
    'common.loading': 'Cargando...',
    'common.present': 'Presente',
    'common.system': 'Worker Management System',
    'common.welcome': 'Bienvenido al Sistema de Gestión',
    'common.redirecting': 'Redirigiendo...',
    
    // Underage blocked page
    'underage.title': 'Aviso de Restricción de Edad',
    'underage.message': 'Apreciamos tu interés en nuestra plataforma. Sin embargo, debes tener al menos 18 años para crear una cuenta y usar nuestros servicios.',
    'underage.emailSaved': 'Tu correo electrónico ha sido guardado, y podrás registrarte cuando cumplas 18 años.',
    'underage.whyTitle': 'Por Qué Esto Importa',
    'underage.whyContent': 'Las leyes de trabajo infantil existen para proteger a los jóvenes de la explotación y asegurar que puedan enfocarse en la educación y el desarrollo. Estas protecciones son importantes porque:',
    'underage.reason1': 'La educación es crucial para el éxito y oportunidades a largo plazo',
    'underage.reason2': 'Los jóvenes necesitan protección de condiciones de trabajo inseguras',
    'underage.reason3': 'Los estándares laborales justos previenen la explotación',
    'underage.reason4': 'Los acuerdos internacionales protegen los derechos de los niños en todo el mundo',
    'underage.resourcesTitle': 'Aprende Más Sobre la Protección Contra el Trabajo Infantil',
    'underage.iloDesc': 'Estándares globales e información sobre la prevención del trabajo infantil',
    'underage.dolDesc': 'Secretaría del Trabajo y Previsión Social - regulaciones y recursos',
    'underage.unicefDesc': 'Iniciativas internacionales de protección infantil e información',
    'underage.clcDesc': 'Coalición que trabaja para acabar con el trabajo infantil en todo el mundo',
    'underage.needHelpTitle': '¿Necesitas Ayuda o Tienes Preocupaciones?',
    'underage.needHelpContent': 'Si tú o alguien que conoces está siendo explotado o forzado a trabajar en condiciones inseguras, hay ayuda disponible:',
    'underage.nationalHotline': 'Línea Nacional contra la Trata de Personas (México)',
    'underage.textLine': 'Línea de Información STPS',
    'underage.textInfo': 'Llama al 800 911 7877 para derechos laborales',
    'underage.returnHome': 'Volver al Inicio',
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('es');

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved && (saved === 'en' || saved === 'es')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
