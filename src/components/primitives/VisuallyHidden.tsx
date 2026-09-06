import type { ReactNode } from 'react';

/** Present for a screen reader, invisible on screen. Never display:none, which
 *  would remove it from the accessibility tree too. */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0 0 0 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {children}
    </span>
  );
}

export default VisuallyHidden;
