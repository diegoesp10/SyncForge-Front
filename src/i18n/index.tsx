import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import es from './locales/es.json';
import en from './locales/en.json';
import { configureApi } from '../api/client';

/*
 * Librería de idioma de SyncForge.
 * - Los textos viven en locales/es.json y locales/en.json (misma estructura; TypeScript lo comprueba).
 * - t('ruta.de.la.clave', { param }) interpola {param}; si el valor es { one, other } elige el plural con params.count.
 * - El idioma activo se envía a la API en Accept-Language para que traduzca errores y avisos.
 */

export type Lang = 'es' | 'en';
export type Messages = typeof es;
type Plural = { one: string; other: string };
type Params = Record<string, string | number>;

/** Todas las rutas a textos: 'files.title', 'backend.states.online.short'… */
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string | Plural ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];
export type MessageKey = Leaves<Messages>;
export type Translate = (key: MessageKey, params?: Params) => string;

// Si a en.json le falta alguna clave de es.json, esta línea no compila
const resources: Record<Lang, Messages> = { es, en };

export const LANGS: Lang[] = ['es', 'en'];
const LOCALES: Record<Lang, string> = { es: 'es-ES', en: 'en-GB' };
const STORAGE_KEY = 'sf-lang';

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'es' || saved === 'en') return saved;
  } catch {
    /* noop */
  }
  return navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en';
}

function lookup(messages: Messages, key: string): unknown {
  return key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], messages);
}

function interpolate(text: string, params?: Params) {
  return params ? text.replace(/\{(\w+)\}/g, (match, name: string) => (params[name] != null ? String(params[name]) : match)) : text;
}

function createTranslator(lang: Lang): { t: Translate; has: (key: string) => key is MessageKey } {
  const messages = resources[lang];
  const plurals = new Intl.PluralRules(LOCALES[lang]);
  const t: Translate = (key, params) => {
    const value = lookup(messages, key);
    if (typeof value === 'string') return interpolate(value, params);
    if (value && typeof value === 'object' && 'other' in value) {
      const plural = value as Plural;
      return interpolate(plurals.select(Number(params?.count ?? 0)) === 'one' ? plural.one : plural.other, params);
    }
    return key; // clave inexistente: se ve en pantalla para detectarla
  };
  const has = (key: string): key is MessageKey => lookup(messages, key) !== undefined;
  return { t, has };
}

interface I18n {
  lang: Lang;
  /** Locale para Intl (fechas, números, tiempos relativos) */
  locale: string;
  t: Translate;
  /** Comprueba si existe una clave (para textos dinámicos que vienen de la API, como las claves del resumen) */
  has: (key: string) => key is MessageKey;
  setLang: (lang: Lang) => void;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const value = useMemo<I18n>(() => {
    const { t, has } = createTranslator(lang);
    // Se configura durante el render para que las primeras peticiones de los hijos ya salgan con el idioma correcto
    configureApi(lang, t);
    return { lang, locale: LOCALES[lang], t, has, setLang: setLangState };
  }, [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* noop */
    }
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n debe usarse dentro de <I18nProvider>');
  return ctx;
}

/** Ejecuta `effect` cada vez que cambia el idioma (no en el primer render). */
export function useOnLanguageChange(effect: (lang: Lang) => void) {
  const { lang } = useI18n();
  const previous = useRef(lang);
  const latest = useRef(effect);
  useLayoutEffect(() => {
    latest.current = effect;
  });
  useEffect(() => {
    if (previous.current === lang) return;
    previous.current = lang;
    latest.current(lang);
  }, [lang]);
}
