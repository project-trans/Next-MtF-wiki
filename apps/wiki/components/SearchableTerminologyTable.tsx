'use client';

import { Fragment, useMemo, useRef, useState } from 'react';
import { t } from '@/lib/i18n/client';

export interface TermEntry {
  id: string;
  wikidata: string;
  category: string;
  abbr: string;
  'zh-cn': string;
  'zh-hant': string;
  ja: string;
  en: string;
  es: string;
  source: string;
  'aliases-zh-cn': string;
  'aliases-zh-hant': string;
  'aliases-ja': string;
  'aliases-en': string;
  'aliases-es': string;
  avoid: string;
  disputed: string;
  notes: string;
}

interface Props {
  data: string;
  lang: string;
}

const LANG_ORDER = ['zh-cn', 'zh-hant', 'ja', 'en', 'es'] as const;
type LangCode = (typeof LANG_ORDER)[number];

const LANG_LABELS: Record<LangCode, string> = {
  'zh-cn': '简体中文',
  'zh-hant': '繁体中文',
  ja: '日本語',
  en: 'English',
  es: 'Español',
};

const CATEGORY_ORDER = [
  'identity',
  'hrt',
  'surgery',
  'voice',
  'hair-removal',
  'medical',
  'legal',
  'social',
  'lab',
  'misc',
] as const;

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  identity: {
    'zh-cn': '身份认同',
    'zh-hant': '身份認同',
    ja: 'アイデンティティ',
    en: 'Identity',
    es: 'Identidad',
  },
  hrt: {
    'zh-cn': '激素治疗',
    'zh-hant': '激素治療',
    ja: 'ホルモン療法',
    en: 'Hormone Therapy',
    es: 'Terapia Hormonal',
  },
  surgery: {
    'zh-cn': '手术',
    'zh-hant': '手術',
    ja: '手術',
    en: 'Surgery',
    es: 'Cirugía',
  },
  voice: {
    'zh-cn': '嗓音',
    'zh-hant': '嗓音',
    ja: '音声',
    en: 'Voice',
    es: 'Voz',
  },
  'hair-removal': {
    'zh-cn': '脱毛',
    'zh-hant': '脫毛',
    ja: '脱毛',
    en: 'Hair Removal',
    es: 'Depilación',
  },
  medical: {
    'zh-cn': '医疗体系',
    'zh-hant': '醫療體系',
    ja: '医療体制',
    en: 'Medical',
    es: 'Sistema Médico',
  },
  legal: {
    'zh-cn': '法律与证件',
    'zh-hant': '法律與證件',
    ja: '法律・証明書',
    en: 'Legal',
    es: 'Legal',
  },
  social: {
    'zh-cn': '社群与社会',
    'zh-hant': '社群與社會',
    ja: '社会',
    en: 'Social',
    es: 'Social',
  },
  lab: {
    'zh-cn': '检验指标',
    'zh-hant': '檢驗指標',
    ja: '検査値',
    en: 'Lab Values',
    es: 'Valores Lab',
  },
  misc: {
    'zh-cn': '其他',
    'zh-hant': '其他',
    ja: 'その他',
    en: 'Other',
    es: 'Otros',
  },
};

function parseTsv(raw: string): TermEntry[] {
  const lines = raw.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split('\t');
  return lines.slice(1).map((line) => {
    const cells = line.split('\t');
    return Object.fromEntries(
      headers.map((h, i) => [h, cells[i] ?? '']),
    ) as unknown as TermEntry;
  });
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 dark:bg-yellow-700/70 text-inherit not-italic rounded-sm px-px">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function hasExpandContent(e: TermEntry, lang: string): boolean {
  return (
    (lang === 'zh-cn' && !!(e.avoid || e.disputed || e.notes)) || !!e.wikidata
  );
}

function getCategoryLabel(category: string, lang: string): string {
  return (
    CATEGORY_LABELS[category]?.[lang] ??
    CATEGORY_LABELS[category]?.en ??
    category
  );
}

export default function SearchableTerminologyTable({ data, lang }: Props) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [hiddenCols, setHiddenCols] = useState<Set<LangCode>>(new Set());
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const colMenuRef = useRef<HTMLDivElement>(null);

  const entries = useMemo(() => parseTsv(data), [data]);

  const langOrder = useMemo<LangCode[]>(() => {
    const cur = lang as LangCode;
    const base = LANG_ORDER.includes(cur)
      ? [cur, ...LANG_ORDER.filter((l) => l !== cur)]
      : [...LANG_ORDER];
    return base.filter((l) => !hiddenCols.has(l));
  }, [lang, hiddenCols]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return entries;
    return entries.filter((e) =>
      [
        e['zh-cn'],
        e['zh-hant'],
        e.ja,
        e.en,
        e.es,
        e.abbr,
        e['aliases-zh-cn'],
        e['aliases-zh-hant'],
        e['aliases-ja'],
        e['aliases-en'],
        e['aliases-es'],
        e.notes,
      ].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [entries, query]);

  const grouped = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => {
      const ai = (CATEGORY_ORDER as readonly string[]).indexOf(a.category);
      const bi = (CATEGORY_ORDER as readonly string[]).indexOf(b.category);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
    const groups: { category: string; entries: TermEntry[] }[] = [];
    for (const entry of sorted) {
      const last = groups[groups.length - 1];
      if (last && last.category === entry.category) last.entries.push(entry);
      else groups.push({ category: entry.category, entries: [entry] });
    }
    return groups;
  }, [filtered]);

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleCol = (l: LangCode) =>
    setHiddenCols((prev) => {
      const next = new Set(prev);
      next.has(l) ? next.delete(l) : next.add(l);
      return next;
    });

  const countText = t('terminology-count', lang)
    .replace('{shown}', String(filtered.length))
    .replace('{total}', String(entries.length));

  const colCount = langOrder.length + 1;

  return (
    <div className="my-6 not-prose">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <input
          type="search"
          className="input input-bordered input-sm flex-1 min-w-40 max-w-sm"
          placeholder={t('terminology-search', lang)}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t('terminology-search', lang)}
        />
        <span className="text-sm text-base-content/60 shrink-0">
          {countText}
        </span>

        {/* Column visibility toggle */}
        <div className="relative shrink-0" ref={colMenuRef}>
          <button
            type="button"
            className="btn btn-sm btn-ghost gap-1"
            onClick={() => setColMenuOpen((v) => !v)}
            aria-expanded={colMenuOpen}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
            {t('terminology-columns', lang)}
          </button>
          {colMenuOpen && (
            <div className="absolute right-0 z-50 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg p-2 flex flex-col gap-1 min-w-36">
              {LANG_ORDER.map((l) => (
                <label
                  key={l}
                  className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-base-200 text-sm"
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs"
                    checked={!hiddenCols.has(l)}
                    onChange={() => toggleCol(l)}
                  />
                  {LANG_LABELS[l]}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-base-300">
        <table className="table table-xs table-pin-rows w-full">
          <thead>
            <tr className="bg-base-200">
              {langOrder.map((l) => (
                <th key={l} className="whitespace-nowrap">
                  {LANG_LABELS[l]}
                </th>
              ))}
              <th className="w-5" aria-label="expand" />
            </tr>
          </thead>
          <tbody>
            {grouped.length === 0 ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="text-center text-base-content/50 py-8"
                >
                  {t('terminology-no-results', lang)}
                </td>
              </tr>
            ) : (
              grouped.map(({ category, entries: catEntries }) => (
                <Fragment key={category}>
                  {/* Category header */}
                  <tr className="bg-base-200/80">
                    <td
                      colSpan={colCount}
                      className="py-1 px-3 text-xs font-semibold uppercase tracking-wide text-base-content/50 whitespace-nowrap"
                    >
                      {getCategoryLabel(category, lang)}
                    </td>
                  </tr>

                  {/* Term rows */}
                  {catEntries.map((entry) => {
                    const isOpen = expanded.has(entry.id);
                    const canExpand = hasExpandContent(entry, lang);

                    return (
                      <Fragment key={entry.id}>
                        <tr
                          className={
                            canExpand
                              ? 'hover:bg-base-200/50 cursor-pointer'
                              : ''
                          }
                          onClick={() => canExpand && toggleExpand(entry.id)}
                          aria-expanded={canExpand ? isOpen : undefined}
                        >
                          {langOrder.map((l) => {
                            const term = entry[l];
                            return (
                              <td
                                key={l}
                                className="align-top whitespace-nowrap"
                              >
                                {/* Main term */}
                                <span
                                  className={
                                    l === (lang as LangCode)
                                      ? 'font-medium'
                                      : 'text-base-content/70'
                                  }
                                >
                                  {term ? (
                                    highlight(term, query)
                                  ) : (
                                    <span className="text-base-content/25">
                                      —
                                    </span>
                                  )}
                                </span>

                                {/* Abbreviation chip — shown in all columns */}
                                {entry.abbr && term && (
                                  <span className="ml-1.5 badge badge-xs badge-outline text-base-content/45 align-middle">
                                    {highlight(entry.abbr, query)}
                                  </span>
                                )}

                                {/* Aliases — per language, as small chips */}
                                {(() => {
                                  const key = `aliases-${l}` as keyof TermEntry;
                                  const raw = entry[key] as string;
                                  const list = raw
                                    ? raw
                                        .split('/')
                                        .map((a) => a.trim())
                                        .filter(Boolean)
                                    : [];
                                  return list.length > 0 ? (
                                    <div className="mt-1 flex flex-wrap gap-0.5">
                                      {list.map((alias) => (
                                        <span
                                          key={alias}
                                          className="badge badge-xs badge-ghost text-[10px] text-base-content/40"
                                        >
                                          {highlight(alias, query)}
                                        </span>
                                      ))}
                                    </div>
                                  ) : null;
                                })()}
                              </td>
                            );
                          })}
                          <td className="text-right align-top whitespace-nowrap">
                            <span className="inline-flex items-center gap-1">
                              {entry.wikidata && (
                                <span
                                  className="text-[10px] text-base-content/30 font-mono leading-none"
                                  title={`Wikidata: ${entry.wikidata}`}
                                  aria-hidden="true"
                                >
                                  W
                                </span>
                              )}
                              {canExpand && (
                                <span
                                  className={`inline-block transition-transform duration-150 text-base-content/40 ${isOpen ? 'rotate-90' : ''}`}
                                  aria-hidden="true"
                                >
                                  ›
                                </span>
                              )}
                            </span>
                          </td>
                        </tr>

                        {/* Expanded detail row */}
                        {isOpen && canExpand && (
                          <tr
                            key={`${entry.id}-detail`}
                            className="bg-base-200"
                          >
                            <td colSpan={colCount} className="px-4 py-3">
                              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                                {lang === 'zh-cn' && entry.avoid && (
                                  <>
                                    <dt className="font-semibold text-error/80">
                                      {t('terminology-avoid', lang)}
                                    </dt>
                                    <dd className="text-error/70">
                                      {entry.avoid.replace(/\//g, ' / ')}
                                    </dd>
                                  </>
                                )}
                                {lang === 'zh-cn' && entry.disputed && (
                                  <>
                                    <dt className="font-semibold text-warning/80">
                                      {t('terminology-disputed', lang)}
                                    </dt>
                                    <dd className="text-warning/70">
                                      {entry.disputed.replace(/\//g, ' / ')}
                                    </dd>
                                  </>
                                )}
                                {lang === 'zh-cn' && entry.notes && (
                                  <>
                                    <dt className="font-semibold text-base-content/60 sm:col-span-2">
                                      {t('terminology-notes', lang)}
                                    </dt>
                                    <dd className="sm:col-span-2 text-base-content/80">
                                      {entry.notes}
                                    </dd>
                                  </>
                                )}
                                {entry.wikidata &&
                                  (() => {
                                    const wikiLang =
                                      (
                                        {
                                          'zh-cn': 'zh',
                                          'zh-hant': 'zh',
                                          ja: 'ja',
                                          en: 'en',
                                          es: 'es',
                                        } as Record<string, string>
                                      )[lang] ?? 'en';
                                    const isEnglish = wikiLang === 'en';
                                    return (
                                      <>
                                        <dt className="font-semibold text-base-content/60">
                                          Wikidata
                                        </dt>
                                        <dd className="flex items-center gap-2 flex-wrap">
                                          <a
                                            href={`https://www.wikidata.org/wiki/${entry.wikidata}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="link font-mono text-base-content/70 hover:text-base-content"
                                            onClick={(ev) =>
                                              ev.stopPropagation()
                                            }
                                          >
                                            {entry.wikidata}
                                          </a>
                                          {!isEnglish && (
                                            <a
                                              href={`https://www.wikidata.org/wiki/Special:GoToLinkedPage/${wikiLang}wiki/${entry.wikidata}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="link text-base-content/70 hover:text-base-content"
                                              onClick={(ev) =>
                                                ev.stopPropagation()
                                              }
                                            >
                                              Wikipedia ↗
                                            </a>
                                          )}
                                          <a
                                            href={`https://www.wikidata.org/wiki/Special:GoToLinkedPage/enwiki/${entry.wikidata}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="link text-base-content/70 hover:text-base-content"
                                            onClick={(ev) =>
                                              ev.stopPropagation()
                                            }
                                          >
                                            {isEnglish
                                              ? 'Wikipedia ↗'
                                              : 'Wikipedia (EN) ↗'}
                                          </a>
                                        </dd>
                                      </>
                                    );
                                  })()}
                              </dl>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
