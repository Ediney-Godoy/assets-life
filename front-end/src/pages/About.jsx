import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BUILD_TIME, getDisplayVersion } from '../version';
import { Info, Cpu, LifeBuoy, Hash } from 'lucide-react';

export default function AboutPage() {
  const { t } = useTranslation();
  const [activeTopic, setActiveTopic] = useState('origin');

  const topics = [
    { id: 'origin', label: t('about_origin_title') || 'Origem', icon: <Info size={18} /> },
    { id: 'technology', label: t('about_tech_title') || 'Tecnologia', icon: <Cpu size={18} /> },
    { id: 'help', label: t('about_help_title') || 'Ajuda e Suporte', icon: <LifeBuoy size={18} /> },
    { id: 'version', label: t('about_version_title') || 'Versão', icon: <Hash size={18} /> }
  ];

  const renderContent = () => {
    switch (activeTopic) {
      case 'origin':
        return (
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {t('about_origin_title')}
            </div>
            <p className="text-slate-700 dark:text-slate-300">
              {t('about_origin')}
            </p>
          </div>
        );
      case 'technology':
        return (
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {t('about_tech_title')}
            </div>
            <ul className="text-slate-700 dark:text-slate-300 space-y-1 list-disc pl-5">
              <li>{t('about_frontend')}</li>
              <li>{t('about_backend')}</li>
              <li>{t('about_security')}</li>
              <li>{t('about_deploy')}</li>
            </ul>
          </div>
        );
      case 'help':
        return (
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {t('about_help_title')}
            </div>
            <p className="text-slate-700 dark:text-slate-300">
              {t('about_help')}
            </p>
          </div>
        );
      case 'version':
      default:
        return (
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {t('about_version_title') || 'Versão'}
            </div>
            <div className="text-sm text-slate-700 dark:text-slate-300">
              Assets Life v{getDisplayVersion()}
            </div>
            {BUILD_TIME && (
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Build: {new Date(BUILD_TIME).toLocaleString()}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4">
      <aside className="w-full md:w-64 flex-none flex flex-col gap-2 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">
          {t('about_title')}
        </h2>
        <nav className="space-y-1">
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => setActiveTopic(topic.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
                activeTopic === topic.id
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={
                    activeTopic === topic.id
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  }
                >
                  {topic.icon}
                </span>
                <span className="truncate">{topic.label}</span>
              </div>
            </button>
          ))}
        </nav>
      </aside>

      <section className="flex-1 space-y-4">
        <p className="text-slate-700 dark:text-slate-300 mb-2">
          {t('about_purpose')}
        </p>
        {renderContent()}
      </section>
    </div>
  );
}
