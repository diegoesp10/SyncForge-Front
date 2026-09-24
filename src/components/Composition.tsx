import type { CSSProperties } from 'react';

// Composiciones geométricas decorativas (círculo, semicírculo, cuadrado, línea) al estilo Bauhaus.
// Las posiciones van en % del contenedor, que es cuadrado salvo que se indique otra proporción en CSS.
type Kind = 'circle' | 'half-r' | 'half-t' | 'square' | 'bar' | 'ring';
type Tone = 'blue' | 'red' | 'ochre' | 'blush' | 'sage' | 'ink';
type Shape = [Kind, Tone, CSSProperties];

const presets = {
  upload: [
    ['circle', 'blush', { left: '0%', top: '2%', width: '15%', aspectRatio: '1' }],
    ['circle', 'blue', { left: '8%', top: '20%', width: '56%', aspectRatio: '1' }],
    ['half-r', 'red', { left: '50%', top: '6%', width: '30%', height: '60%' }],
    ['square', 'ochre', { left: '62%', top: '63%', width: '24%', aspectRatio: '1', rotate: '12deg' }],
    ['bar', 'ink', { left: '0%', top: '84%', width: '66%', height: '2px', rotate: '-16deg' }],
  ],
  sidebar: [
    ['half-t', 'ochre', { left: '8%', top: '38%', width: '42%', height: '62%' }],
    ['circle', 'blue', { left: '38%', top: '14%', width: '30%', aspectRatio: '1' }],
    ['square', 'red', { left: '72%', top: '48%', width: '16%', aspectRatio: '1', rotate: '-8deg' }],
    ['ring', 'ink', { left: '64%', top: '8%', width: '22%', aspectRatio: '1' }],
  ],
  empty: [
    ['ring', 'ink', { left: '10%', top: '10%', width: '60%', aspectRatio: '1' }],
    ['circle', 'blush', { left: '40%', top: '36%', width: '50%', aspectRatio: '1' }],
    ['bar', 'red', { left: '6%', top: '84%', width: '88%', height: '2px' }],
  ],
} satisfies Record<string, Shape[]>;

export function Composition({ preset, className = '' }: { preset: keyof typeof presets; className?: string }) {
  return (
    <div className={`composition ${className}`} aria-hidden>
      {(presets[preset] as Shape[]).map(([kind, tone, style], i) => (
        <span key={i} className={`shape ${kind} c-${tone} sh-${i}`} style={style} />
      ))}
    </div>
  );
}
