import { FileBraces, FileSpreadsheet, FileText, File, Table2 } from 'lucide-react';
import { familyOf } from '../utils/format';

const map = {
  table: { Icon: Table2, cls: 'fi-table' },
  code: { Icon: FileBraces, cls: 'fi-code' },
  text: { Icon: FileText, cls: 'fi-text' },
  sheet: { Icon: FileSpreadsheet, cls: 'fi-sheet' },
  other: { Icon: File, cls: 'fi-other' },
};

export function FileIcon({ name, size = 18 }: { name: string; size?: number }) {
  const { Icon, cls } = map[familyOf(name)];
  return (
    <span className={`file-icon ${cls}`}>
      <Icon size={size} strokeWidth={1.8} />
    </span>
  );
}
