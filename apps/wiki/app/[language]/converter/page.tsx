import { Link } from '@/components/progress';
import SuggestionBox from '@/components/SuggestionBox';
import { t } from '@/lib/i18n/client';
import { HormoneConverter } from './components/HormoneConverter';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const { language } = await params;
  return {
    title: `${t('conv-page-title', language)} - MtF.wiki`,
  };
}

export default async function ConverterPage({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const { language } = await params;
  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-6 md:mb-8 relative">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl font-bold text-base-content">
              {t('conv-page-title', language)}
            </h1>
          </div>
          <p className="text-sm">
            {t('conv-page-intro', language)}{' '}
            <Link
              href={`/${language}/converter/science-literacy`}
              className="link"
            >
              {t('conv-science-literacy', language)}
            </Link>
            {' 。'}
          </p>
        </header>
        <HormoneConverter language={language} />

        <footer className="mt-8 md:mt-12 p-4 md:p-6 bg-base-200/50 rounded-xl">
          <div className="text-sm text-base-content/60 space-y-2">
            <p>
              <strong>{t('conv-note-prefix', language)}：</strong>
              {t('conv-iu-note', language)} {t('conv-detail-see', language)}{' '}
              <Link
                href={`/${language}/converter/science-literacy`}
                className="link link-primary"
              >
                {t('conv-iu-detail-link', language)}
              </Link>
            </p>
            <p>
              <strong>{t('conv-data-storage', language)}：</strong>
              {t('conv-history-note', language)}
            </p>
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
