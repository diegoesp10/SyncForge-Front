import type { KeyboardEvent, MouseEvent } from 'react';
import { RefreshCw, RotateCcw, Trash2 } from 'lucide-react';
import type { TrashItem } from '../api/types';
import type { Trash } from '../hooks/useTrash';
import { useI18n } from '../i18n';
import { FileIcon } from './FileIcon';
import { Composition } from './Composition';
import { AsyncButton } from './AsyncButton';
import { ConfirmButton } from './ConfirmButton';
import { LoadingState } from './Loader';
import { daysUntil, formatBytes, formatDay, inDays, timeAgo } from '../utils/format';

interface Props {
  trash: Trash;
  onOpen: (item: TrashItem) => void;
  onRestore: (id: string) => Promise<void>;
  onPurge: (id: string) => Promise<void>;
  onEmpty: () => Promise<void>;
}

/** Cuenta atrás hasta la eliminación: texto relativo, fecha exacta y barra con el tiempo que queda. */
export function PurgeCountdown({ item }: { item: TrashItem }) {
  const { t, locale } = useI18n();
  const days = daysUntil(item.purgeAt);
  const total = new Date(item.purgeAt).getTime() - new Date(item.movedAt).getTime();
  const left = Math.min(1, Math.max(0, (new Date(item.purgeAt).getTime() - Date.now()) / total));
  return (
    <div className={`purge ${days <= 3 ? 'is-soon' : ''}`} title={t('trash.purgeDate', { date: formatDay(item.purgeAt, locale) })}>
      <span>{days > 0 ? t('trash.purgesIn', { when: inDays(days, locale) }) : t('trash.purgingSoon')}</span>
      <i className="purge-bar" aria-hidden>
        <b style={{ width: `${left * 100}%` }} />
      </i>
    </div>
  );
}

export function TrashView({ trash, onOpen, onRestore, onPurge, onEmpty }: Props) {
  const { t, locale } = useI18n();
  const { items, loading, error, refresh } = trash;

  // Las acciones no deben abrir el detalle de la fila en la que están
  const stop = { onClick: (e: MouseEvent) => e.stopPropagation(), onKeyDown: (e: KeyboardEvent) => e.stopPropagation() };

  const actions = (item: TrashItem) => (
    <div className="trash-actions" {...stop}>
      <AsyncButton
        className="btn-ghost sm"
        icon={<RotateCcw size={14} />}
        busyLabel={t('trash.restoring')}
        aria-label={t('trash.restoreAria', { name: item.fileName })}
        onClick={() => onRestore(item.id)}
      >
        {t('trash.restore')}
      </AsyncButton>
      <ConfirmButton
        className="icon-btn danger"
        icon={<Trash2 size={15} />}
        confirmLabel={t('trash.purgeConfirm')}
        busyLabel={t('trash.purging')}
        title={t('trash.purge')}
        aria-label={t('trash.purgeAria', { name: item.fileName })}
        onConfirm={() => onPurge(item.id)}
      />
    </div>
  );

  return (
    <div className="trash-view">
      <div className="trash-notice" role="note">
        <span className="trash-clock" aria-hidden>
          <i />
        </span>
        <div>
          <p className="trash-notice-title">{t('trash.noticeTitle')}</p>
          <p>{t('trash.notice')}</p>
        </div>
      </div>

      <section className="card file-list trash-list">
        <div className="card-head wrap">
          <h3>{t('trash.title')}</h3>
          <span className="count">{items.length}</span>
          <div className="fl-tools">
            <AsyncButton className="icon-btn" onClick={refresh} icon={<RefreshCw size={15} />} aria-label={t('files.refresh')} title={t('files.refresh')} />
            {items.length > 0 && (
              <ConfirmButton
                className="btn-ghost sm danger"
                icon={<Trash2 size={14} />}
                confirmLabel={t('trash.emptyConfirm')}
                busyLabel={t('trash.emptying')}
                onConfirm={onEmpty}
              >
                {t('trash.emptyAll')}
              </ConfirmButton>
            )}
          </div>
        </div>

        {loading ? (
          <LoadingState label={t('trash.loading')} />
        ) : error && items.length === 0 ? (
          <div className="empty is-error">
            <Composition preset="empty" />
            <p>{t('trash.loadFailed')}</p>
            <small>{error}</small>
            <AsyncButton className="btn-ghost sm" icon={<RefreshCw size={14} />} busyLabel={t('files.retrying')} onClick={refresh}>
              {t('files.retry')}
            </AsyncButton>
          </div>
        ) : items.length === 0 ? (
          <div className="empty">
            <Composition preset="empty" />
            <p>{t('trash.empty')}</p>
            <small>{t('trash.emptyHint')}</small>
          </div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th className="col-name">{t('trash.columns.name')}</th>
                  <th className="num col-type">{t('trash.columns.size')}</th>
                  <th className="col-date">{t('trash.columns.moved')}</th>
                  <th>{t('trash.columns.purge')}</th>
                  <th className="num">{t('trash.columns.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} onClick={() => onOpen(item)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen(item)}>
                    <td className="col-name">
                      <div className="name-cell">
                        <FileIcon name={item.fileName} />
                        <div className="name-text">
                          <span title={item.fileName}>{item.fileName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="num mono col-type">{formatBytes(item.size)}</td>
                    <td className="col-date muted">{timeAgo(item.movedAt, locale)}</td>
                    <td><PurgeCountdown item={item} /></td>
                    <td className="num">{actions(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="file-cards">
              {items.map((item) => (
                <li key={item.id} className="trash-card" onClick={() => onOpen(item)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen(item)}>
                  <FileIcon name={item.fileName} size={20} />
                  <div className="fc-body">
                    <span className="fc-name" title={item.fileName}>{item.fileName}</span>
                    <span className="fc-meta">
                      <span className="mono">{formatBytes(item.size)}</span> · {timeAgo(item.movedAt, locale)}
                    </span>
                    <PurgeCountdown item={item} />
                    {actions(item)}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
