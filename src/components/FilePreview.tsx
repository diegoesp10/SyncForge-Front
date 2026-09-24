import type { FileResult } from '../api/types';

export function FilePreview({ preview }: { preview: FileResult['preview'] }) {
  if (preview.kind === 'table' && preview.columns) {
    return (
      <div className="preview-table-wrap">
        <table className="preview-table">
          <thead>
            <tr>
              <th className="rownum">#</th>
              {preview.columns.map((c, i) => <th key={i}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {(preview.rows ?? []).map((r, i) => (
              <tr key={i}>
                <td className="rownum">{i + 1}</td>
                {r.map((c, j) => (
                  <td key={j} className={typeof c === 'number' ? 'num' : undefined}>{c ?? <span className="muted">null</span>}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (preview.kind === 'json') {
    return <pre className="code-block" dangerouslySetInnerHTML={{ __html: highlightJson(preview.json) }} />;
  }
  return <pre className="code-block plain">{preview.text}</pre>;
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightJson(value: unknown) {
  const json = esc(JSON.stringify(value, null, 2) ?? '');
  return json.replace(
    /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (m) => {
      let cls = 'j-num';
      if (m.startsWith('"')) cls = m.endsWith(':') ? 'j-key' : 'j-str';
      else if (/true|false/.test(m)) cls = 'j-bool';
      else if (m === 'null') cls = 'j-null';
      return `<span class="${cls}">${m}</span>`;
    },
  );
}
