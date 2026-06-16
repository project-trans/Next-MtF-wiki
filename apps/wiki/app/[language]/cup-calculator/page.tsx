import { Ruler, Shield } from 'lucide-react';
import SuggestionBox from '@/components/SuggestionBox';
import { t } from '@/lib/i18n/client';
import { CupCalculator } from './components/CupCalculator';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const { language } = await params;
  return {
    title: `${t('cup-page-title', language)} - MtF.wiki`,
  };
}

export default async function CupCalculatorPage({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const { language } = await params;
  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-6 md:mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Ruler className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-base-content">
              {t('cup-page-title', language)}
            </h1>
          </div>
          <p className="text-base-content/70 text-lg max-w-2xl mx-auto">
            {t('cup-page-description', language)}
          </p>
        </header>

        <CupCalculator language={language} />

        <footer className="mt-8 md:mt-12 p-4 md:p-6 bg-base-200/50 rounded-xl">
          <div className="text-sm text-base-content/60 space-y-3">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-base-content mb-1">
                  {t('cup-privacy-title', language)}
                </p>
                <p>{t('cup-privacy-text', language)}</p>
              </div>
            </div>

            <div className="border-t border-base-300/30 pt-3">
              <p>
                <strong>{t('cup-disclaimer-title', language)}：</strong>
                {t('cup-disclaimer-text', language)}
              </p>
            </div>

            <div className="border-t border-base-300/30 pt-3">
              <p>
                <strong>{t('cup-algorithm-title', language)}：</strong>
                {t('cup-algorithm-text', language)}
              </p>
            </div>
          </div>
        </footer>
        <div className="mt-8">
          <SuggestionBox />
        </div>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  return [
    { language: 'zh-cn' },
    { language: 'zh-hant' },
    { language: 'ja' },
    { language: 'en' },
    { language: 'es' },
  ];
}
