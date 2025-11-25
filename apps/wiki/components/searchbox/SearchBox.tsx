import { sT } from '@/lib/i18n/server';
import SearchBoxClient from './SearchBoxClient';
import 'server-only';

export default function SearchBox({
  language,
  placeholder,
  compact = false,
}: {
  language: string;
  placeholder?: string;
  compact?: boolean;
}) {
  return (
    <SearchBoxClient
      language={language}
      placeholder={placeholder}
      serverBuildIndex={process.env.NEXT_PUBLIC_SERVER_BUILD_INDEX === 'true'}
      notFoundText={sT('search-documents-not-found', language)}
      tryDifferentKeywordsText={sT(
        'search-documents-try-different-keywords',
        language,
      )}
      compact={compact}
    />
  );
}
