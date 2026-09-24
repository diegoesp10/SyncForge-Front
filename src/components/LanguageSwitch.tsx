import { LANGS, useI18n } from '../i18n';
import es from '../i18n/locales/es.json';
import en from '../i18n/locales/en.json';

// Cada idioma se anuncia en su propia lengua, sea cual sea el activo
const names = { es: es.meta, en: en.meta };

/** Selector ES / EN: cambia toda la interfaz y el idioma que se pide a la API. */
export function LanguageSwitch() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="theme-switch lang-switch" role="radiogroup" aria-label={t('language.aria')} data-value={lang}>
      <i className="theme-thumb" aria-hidden />
      {LANGS.map((id) => (
        <button
          key={id}
          role="radio"
          aria-checked={lang === id}
          lang={id}
          className={lang === id ? 'active' : ''}
          title={names[id].name}
          aria-label={names[id].name}
          onClick={() => lang !== id && setLang(id)}
        >
          <b>{names[id].short}</b>
        </button>
      ))}
    </div>
  );
}
