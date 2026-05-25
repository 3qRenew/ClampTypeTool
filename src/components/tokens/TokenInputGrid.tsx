import React, { useEffect, useRef, useState } from 'react';
import type { TokenKey, TypographyTokenKey, ResponsiveTokenValue, TokenValueMap, CustomTokenItem } from '../../types';
import { TYPOGRAPHY_TOKEN_KEYS, SPACING_TOKEN_KEYS, WRAPPER_TYPOGRAPHY_KEYS } from '../../data/tokenDefaults';

export interface ClampPair {
  mobile: string;
  desktop: string;
}

export type TypoMbMap = Partial<Record<TypographyTokenKey, number | ''>>;

interface Props {
  tokens: TokenValueMap;
  clampResults: Record<TokenKey, ClampPair>;
  customTokens: CustomTokenItem[];
  customResultMap: Record<string, ClampPair>;
  typoMb: TypoMbMap;
  onTokenChange: (key: TokenKey, scope: 'mobile' | 'desktop', field: 'minPx' | 'maxPx', raw: string) => void;
  onMbChange: (key: TypographyTokenKey, raw: string) => void;
  onClearToken: (key: TokenKey) => void;
  onAddCustom: (category: 'typography' | 'spacing') => void;
  onCustomKeyChange: (id: string, key: string) => void;
  onCustomChange: (id: string, scope: 'mobile' | 'desktop', field: 'minPx' | 'maxPx', raw: string) => void;
  onCustomMbChange: (id: string, raw: string) => void;
  onCustomDelete: (id: string) => void;
}

// ── Typography row (predefined) ──

interface TypoRowProps {
  token: ResponsiveTokenValue;
  clampPair: ClampPair;
  mbPx: number | '';
  isWrapper: boolean;
  onChange: (scope: 'mobile' | 'desktop', field: 'minPx' | 'maxPx', raw: string) => void;
  onMbChange: (raw: string) => void;
  onClear: () => void;
}

const TypoRow: React.FC<TypoRowProps> = ({ token, clampPair, mbPx, isWrapper, onChange, onMbChange, onClear }) => {
  const [copied, setCopied] = useState(false);
  const hasMobile = clampPair.mobile !== '';
  const hasDesktop = clampPair.desktop !== '';
  const hasMb = mbPx !== '' && mbPx !== undefined;
  const hasAny = hasMobile || hasDesktop;

  const refFontPx = token.desktop.maxPx;
  const hasRef = refFontPx !== '' && (refFontPx as number) > 0;
  const mbNum: number | null = hasMb
    ? parseFloat(((mbPx as number) / (hasRef ? (refFontPx as number) : 16)).toFixed(3))
    : null;
  const mbUnit = hasRef ? 'em' : 'rem';

  const buildCopyText = () => {
    const lines: string[] = [];
    const mbDecl = mbNum !== null ? `\n  margin-bottom: ${mbNum}${mbUnit};` : '';
    if (isWrapper) {
      if (mbNum !== null) lines.push(`${token.key} {${mbDecl}\n}`);
    } else {
      if (hasMobile) lines.push(`${token.key} {\n  font-size: ${clampPair.mobile};${mbDecl}\n}`);
      if (hasDesktop) {
        const inner = `  font-size: ${clampPair.desktop};${mbDecl}`;
        lines.push(`@media (min-width: 992px) {\n  ${token.key} {\n  ${inner}\n  }\n}`);
      }
    }
    return lines.join('\n\n');
  };

  const handleCopy = () => {
    if (!hasAny) return;
    navigator.clipboard.writeText(buildCopyText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };

  return (
    <tr className={`token-row${isWrapper ? ' token-row--wrapper' : ''}`}>
      <td className="token-key td-mono">
        {token.key}
        {isWrapper && <span className="token-wrapper-badge">wrapper</span>}
      </td>
      {isWrapper ? (
        <td className="token-cell token-cell-wrapper-span token-cell-desktop-sep" colSpan={4}>
          <span className="token-wrapper-note">margin-bottom only</span>
        </td>
      ) : (
        <>
          <td className="token-cell">
            <input type="number" className="token-input" min={0} step={0.5} placeholder="—"
              value={token.mobile.minPx} onChange={(e) => onChange('mobile', 'minPx', e.target.value)} />
          </td>
          <td className="token-cell">
            <input type="number" className="token-input" min={0} step={0.5} placeholder="—"
              value={token.mobile.maxPx} onChange={(e) => onChange('mobile', 'maxPx', e.target.value)} />
          </td>
          <td className="token-cell token-cell-desktop-sep">
            <input type="number" className="token-input" min={0} step={0.5} placeholder="—"
              value={token.desktop.minPx} onChange={(e) => onChange('desktop', 'minPx', e.target.value)} />
          </td>
          <td className="token-cell">
            <input type="number" className="token-input" min={0} step={0.5} placeholder="—"
              value={token.desktop.maxPx} onChange={(e) => onChange('desktop', 'maxPx', e.target.value)} />
          </td>
        </>
      )}
      <td className="token-cell token-cell-desktop-sep token-mb-cell">
        <input type="number" className="token-input token-input-mb" min={0} step={0.5} placeholder="—"
          value={mbPx ?? ''} onChange={(e) => onMbChange(e.target.value)} />
        {mbNum !== null && (
          <span className="token-mb-em">→ {mbNum}{mbUnit}</span>
        )}
      </td>
      {isWrapper ? (
        <td className="token-cell token-result-cell" colSpan={2}>
          <span className="token-wrapper-note">—</span>
        </td>
      ) : (
        <>
          <td className="token-cell token-result-cell">
            <code className={`token-clamp-code${hasMobile ? ' has-value' : ''}`}>
              {hasMobile ? clampPair.mobile : '—'}
            </code>
          </td>
          <td className="token-cell token-result-cell token-cell-desktop-sep">
            <code className={`token-clamp-code${hasDesktop ? ' has-value' : ''}`}>
              {hasDesktop ? clampPair.desktop : '—'}
            </code>
          </td>
        </>
      )}
      <td className="token-cell token-actions-cell">
        <button className="copy-btn token-copy-btn" disabled={!hasAny && mbNum === null} onClick={handleCopy}>
          {copied ? '✓' : '複製'}
        </button>
        <button className="token-clear-btn" onClick={onClear} title="清除此列">×</button>
      </td>
    </tr>
  );
};

// ── Custom typography row ──

interface CustomTypoRowProps {
  item: CustomTokenItem;
  clampPair: ClampPair;
  onKeyChange: (raw: string) => void;
  onChange: (scope: 'mobile' | 'desktop', field: 'minPx' | 'maxPx', raw: string) => void;
  onMbChange: (raw: string) => void;
  onDelete: () => void;
}

const CustomTypoRow: React.FC<CustomTypoRowProps> = ({ item, clampPair, onKeyChange, onChange, onMbChange, onDelete }) => {
  const [copied, setCopied] = useState(false);
  const keyInputRef = useRef<HTMLInputElement>(null);
  const hasMobile = clampPair.mobile !== '';
  const hasDesktop = clampPair.desktop !== '';
  const hasAny = hasMobile || hasDesktop;

  const hasMb = item.mbPx !== '' && item.mbPx !== undefined;
  const refFontPx = item.desktop.maxPx;
  const hasRef = refFontPx !== '' && (refFontPx as number) > 0;
  const mbNum: number | null = hasMb
    ? parseFloat(((item.mbPx as number) / (hasRef ? (refFontPx as number) : 16)).toFixed(3))
    : null;
  const mbUnit = hasRef ? 'em' : 'rem';

  // Auto-focus when key is empty (newly added)
  useEffect(() => {
    if (!item.key) keyInputRef.current?.focus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const buildCopyText = () => {
    if (!item.key.trim()) return '';
    const lines: string[] = [];
    const mbDecl = mbNum !== null ? `\n  margin-bottom: ${mbNum}${mbUnit};` : '';
    if (hasMobile) lines.push(`${item.key} {\n  font-size: ${clampPair.mobile};${mbDecl}\n}`);
    if (hasDesktop) {
      const inner = `  font-size: ${clampPair.desktop};${mbDecl}`;
      lines.push(`@media (min-width: 992px) {\n  ${item.key} {\n  ${inner}\n  }\n}`);
    }
    return lines.join('\n\n');
  };

  const handleCopy = () => {
    const text = buildCopyText();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };

  return (
    <tr className="token-row token-row--custom">
      <td className="token-cell">
        <input
          ref={keyInputRef}
          type="text"
          className="token-key-input"
          placeholder=".my-class"
          value={item.key}
          onChange={(e) => onKeyChange(e.target.value)}
        />
      </td>
      <td className="token-cell">
        <input type="number" className="token-input" min={0} step={0.5} placeholder="—"
          value={item.mobile.minPx} onChange={(e) => onChange('mobile', 'minPx', e.target.value)} />
      </td>
      <td className="token-cell">
        <input type="number" className="token-input" min={0} step={0.5} placeholder="—"
          value={item.mobile.maxPx} onChange={(e) => onChange('mobile', 'maxPx', e.target.value)} />
      </td>
      <td className="token-cell token-cell-desktop-sep">
        <input type="number" className="token-input" min={0} step={0.5} placeholder="—"
          value={item.desktop.minPx} onChange={(e) => onChange('desktop', 'minPx', e.target.value)} />
      </td>
      <td className="token-cell">
        <input type="number" className="token-input" min={0} step={0.5} placeholder="—"
          value={item.desktop.maxPx} onChange={(e) => onChange('desktop', 'maxPx', e.target.value)} />
      </td>
      <td className="token-cell token-cell-desktop-sep token-mb-cell">
        <input type="number" className="token-input token-input-mb" min={0} step={0.5} placeholder="—"
          value={item.mbPx ?? ''} onChange={(e) => onMbChange(e.target.value)} />
        {mbNum !== null && <span className="token-mb-em">→ {mbNum}{mbUnit}</span>}
      </td>
      <td className="token-cell token-result-cell">
        <code className={`token-clamp-code${hasMobile ? ' has-value' : ''}`}>
          {hasMobile ? clampPair.mobile : '—'}
        </code>
      </td>
      <td className="token-cell token-result-cell token-cell-desktop-sep">
        <code className={`token-clamp-code${hasDesktop ? ' has-value' : ''}`}>
          {hasDesktop ? clampPair.desktop : '—'}
        </code>
      </td>
      <td className="token-cell token-actions-cell">
        <button className="copy-btn token-copy-btn" disabled={!hasAny || !item.key.trim()} onClick={handleCopy}>
          {copied ? '✓' : '複製'}
        </button>
        <button className="token-delete-btn" onClick={onDelete} title="刪除此列">×</button>
      </td>
    </tr>
  );
};

// ── Spacing row (predefined) ──

interface SpacingRowProps {
  token: ResponsiveTokenValue;
  clampPair: ClampPair;
  onChange: (scope: 'mobile' | 'desktop', field: 'minPx' | 'maxPx', raw: string) => void;
  onClear: () => void;
}

const SpacingRow: React.FC<SpacingRowProps> = ({ token, clampPair, onChange, onClear }) => {
  const [copied, setCopied] = useState(false);
  const hasMobile = clampPair.mobile !== '';
  const hasDesktop = clampPair.desktop !== '';
  const hasAny = hasMobile || hasDesktop;

  const buildCopyText = () => {
    const base = '$' + (token.key as string).replace(/^--/, '');
    const isNoSuffix = token.key === '--container-max-width';
    const lines: string[] = [];
    if (hasMobile && !isNoSuffix) lines.push(`${base}-mobile: ${clampPair.mobile};`);
    if (hasDesktop) lines.push(`${isNoSuffix ? base : `${base}-desktop`}: ${clampPair.desktop};`);
    return lines.join('\n');
  };

  const handleCopy = () => {
    if (!hasAny) return;
    navigator.clipboard.writeText(buildCopyText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };

  return (
    <tr className="token-row">
      <td className="token-key td-mono">{token.key}</td>
      <td className="token-cell">
        <input type="number" className="token-input" min={0} step={0.5} placeholder="—"
          value={token.mobile.minPx} onChange={(e) => onChange('mobile', 'minPx', e.target.value)} />
      </td>
      <td className="token-cell">
        <input type="number" className="token-input" min={0} step={0.5} placeholder="—"
          value={token.mobile.maxPx} onChange={(e) => onChange('mobile', 'maxPx', e.target.value)} />
      </td>
      <td className="token-cell token-cell-desktop-sep">
        <input type="number" className="token-input" min={0} step={0.5} placeholder="—"
          value={token.desktop.minPx} onChange={(e) => onChange('desktop', 'minPx', e.target.value)} />
      </td>
      <td className="token-cell">
        <input type="number" className="token-input" min={0} step={0.5} placeholder="—"
          value={token.desktop.maxPx} onChange={(e) => onChange('desktop', 'maxPx', e.target.value)} />
      </td>
      <td className="token-cell token-result-cell">
        <code className={`token-clamp-code${hasMobile ? ' has-value' : ''}`}>
          {hasMobile ? clampPair.mobile : '—'}
        </code>
      </td>
      <td className="token-cell token-result-cell token-cell-desktop-sep">
        <code className={`token-clamp-code${hasDesktop ? ' has-value' : ''}`}>
          {hasDesktop ? clampPair.desktop : '—'}
        </code>
      </td>
      <td className="token-cell token-actions-cell">
        <button className="copy-btn token-copy-btn" disabled={!hasAny} onClick={handleCopy}>
          {copied ? '✓' : '複製'}
        </button>
        <button className="token-clear-btn" onClick={onClear} title="清除此列">×</button>
      </td>
    </tr>
  );
};

// ── Custom spacing row ──

interface CustomSpacingRowProps {
  item: CustomTokenItem;
  clampPair: ClampPair;
  onKeyChange: (raw: string) => void;
  onChange: (scope: 'mobile' | 'desktop', field: 'minPx' | 'maxPx', raw: string) => void;
  onDelete: () => void;
}

const CustomSpacingRow: React.FC<CustomSpacingRowProps> = ({ item, clampPair, onKeyChange, onChange, onDelete }) => {
  const [copied, setCopied] = useState(false);
  const keyInputRef = useRef<HTMLInputElement>(null);
  const hasMobile = clampPair.mobile !== '';
  const hasDesktop = clampPair.desktop !== '';
  const hasAny = hasMobile || hasDesktop;

  useEffect(() => {
    if (!item.key) keyInputRef.current?.focus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const buildCopyText = () => {
    if (!item.key.trim()) return '';
    const base = '$' + item.key.replace(/^--/, '');
    const lines: string[] = [];
    if (hasMobile) lines.push(`${base}-mobile: ${clampPair.mobile};`);
    if (hasDesktop) lines.push(`${base}-desktop: ${clampPair.desktop};`);
    return lines.join('\n');
  };

  const handleCopy = () => {
    const text = buildCopyText();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };

  return (
    <tr className="token-row token-row--custom">
      <td className="token-cell">
        <input
          ref={keyInputRef}
          type="text"
          className="token-key-input"
          placeholder="--my-var"
          value={item.key}
          onChange={(e) => onKeyChange(e.target.value)}
        />
      </td>
      <td className="token-cell">
        <input type="number" className="token-input" min={0} step={0.5} placeholder="—"
          value={item.mobile.minPx} onChange={(e) => onChange('mobile', 'minPx', e.target.value)} />
      </td>
      <td className="token-cell">
        <input type="number" className="token-input" min={0} step={0.5} placeholder="—"
          value={item.mobile.maxPx} onChange={(e) => onChange('mobile', 'maxPx', e.target.value)} />
      </td>
      <td className="token-cell token-cell-desktop-sep">
        <input type="number" className="token-input" min={0} step={0.5} placeholder="—"
          value={item.desktop.minPx} onChange={(e) => onChange('desktop', 'minPx', e.target.value)} />
      </td>
      <td className="token-cell">
        <input type="number" className="token-input" min={0} step={0.5} placeholder="—"
          value={item.desktop.maxPx} onChange={(e) => onChange('desktop', 'maxPx', e.target.value)} />
      </td>
      <td className="token-cell token-result-cell">
        <code className={`token-clamp-code${hasMobile ? ' has-value' : ''}`}>
          {hasMobile ? clampPair.mobile : '—'}
        </code>
      </td>
      <td className="token-cell token-result-cell token-cell-desktop-sep">
        <code className={`token-clamp-code${hasDesktop ? ' has-value' : ''}`}>
          {hasDesktop ? clampPair.desktop : '—'}
        </code>
      </td>
      <td className="token-cell token-actions-cell">
        <button className="copy-btn token-copy-btn" disabled={!hasAny || !item.key.trim()} onClick={handleCopy}>
          {copied ? '✓' : '複製'}
        </button>
        <button className="token-delete-btn" onClick={onDelete} title="刪除此列">×</button>
      </td>
    </tr>
  );
};

// ── Headers ──

interface GroupHeaderProps {
  label: string;
  rangeLabel: string;
  hasMbCol?: boolean;
}

const GroupHeader: React.FC<GroupHeaderProps> = ({ label, rangeLabel, hasMbCol }) => (
  <tr className="token-group-header">
    <th className="th-key">{label}</th>
    <th className="th-val" colSpan={2}>
      <span className="th-scope-label th-scope-mobile">Mobile</span>
      <span className="th-scope-range">{rangeLabel.split('/')[0]}</span>
    </th>
    <th className="th-val token-cell-desktop-sep" colSpan={2}>
      <span className="th-scope-label th-scope-desktop">Desktop</span>
      <span className="th-scope-range">{rangeLabel.split('/')[1]}</span>
    </th>
    {hasMbCol && <th className="th-mb token-cell-desktop-sep">margin-bottom</th>}
    <th className={`th-clamp${hasMbCol ? '' : ' token-cell-desktop-sep'}`}>Mobile clamp()</th>
    <th className="th-clamp token-cell-desktop-sep">Desktop clamp()</th>
    <th className="th-copy"></th>
  </tr>
);

interface SubHeaderProps { hasMbCol?: boolean }

const SubHeader: React.FC<SubHeaderProps> = ({ hasMbCol }) => (
  <tr className="token-sub-header">
    <th></th>
    <th className="th-sub">min px</th>
    <th className="th-sub">max px</th>
    <th className="th-sub token-cell-desktop-sep">min px</th>
    <th className="th-sub">max px</th>
    {hasMbCol && <th className="th-sub token-cell-desktop-sep">px (1920)</th>}
    <th className={hasMbCol ? '' : 'token-cell-desktop-sep'}></th>
    <th className="token-cell-desktop-sep"></th>
    <th></th>
  </tr>
);

// ── Main export ──

export const TokenInputGrid: React.FC<Props> = ({
  tokens, clampResults, customTokens, customResultMap, typoMb,
  onTokenChange, onMbChange, onClearToken,
  onAddCustom, onCustomKeyChange, onCustomChange, onCustomMbChange, onCustomDelete,
}) => {
  const firstTypo = tokens[TYPOGRAPHY_TOKEN_KEYS[0]];
  const mobileRange = `${firstTypo.mobile.minWidth}–${firstTypo.mobile.maxWidth}px`;
  const desktopRange = `${firstTypo.desktop.minWidth}–${firstTypo.desktop.maxWidth}px`;
  const rangeLabel = `${mobileRange}/${desktopRange}`;

  const customTypo    = customTokens.filter((t) => t.category === 'typography');
  const customSpacing = customTokens.filter((t) => t.category === 'spacing');

  return (
    <div className="token-grid-wrap">

      {/* ── Typography section ── */}
      <section className="token-section">
        <table className="token-table">
          <thead>
            <GroupHeader label="Typography" rangeLabel={rangeLabel} hasMbCol />
            <SubHeader hasMbCol />
          </thead>
          <tbody>
            {TYPOGRAPHY_TOKEN_KEYS.map((key) => (
              <TypoRow
                key={key}
                token={tokens[key]}
                clampPair={clampResults[key]}
                mbPx={typoMb[key] ?? ''}
                isWrapper={WRAPPER_TYPOGRAPHY_KEYS.has(key)}
                onChange={(scope, field, raw) => onTokenChange(key, scope, field, raw)}
                onMbChange={(raw) => onMbChange(key, raw)}
                onClear={() => onClearToken(key)}
              />
            ))}
            {customTypo.map((item) => (
              <CustomTypoRow
                key={item.id}
                item={item}
                clampPair={customResultMap[item.id] ?? { mobile: '', desktop: '' }}
                onKeyChange={(raw) => onCustomKeyChange(item.id, raw)}
                onChange={(scope, field, raw) => onCustomChange(item.id, scope, field, raw)}
                onMbChange={(raw) => onCustomMbChange(item.id, raw)}
                onDelete={() => onCustomDelete(item.id)}
              />
            ))}
          </tbody>
        </table>
        <div className="token-add-row">
          <button className="token-add-btn" onClick={() => onAddCustom('typography')}>
            + 新增 Typography
          </button>
        </div>
      </section>

      {/* ── Spacing section ── */}
      <section className="token-section">
        <table className="token-table">
          <thead>
            <GroupHeader label="Spacing" rangeLabel={rangeLabel} />
            <SubHeader />
          </thead>
          <tbody>
            {SPACING_TOKEN_KEYS.map((key) => (
              <SpacingRow
                key={key}
                token={tokens[key]}
                clampPair={clampResults[key]}
                onChange={(scope, field, raw) => onTokenChange(key, scope, field, raw)}
                onClear={() => onClearToken(key)}
              />
            ))}
            {customSpacing.map((item) => (
              <CustomSpacingRow
                key={item.id}
                item={item}
                clampPair={customResultMap[item.id] ?? { mobile: '', desktop: '' }}
                onKeyChange={(raw) => onCustomKeyChange(item.id, raw)}
                onChange={(scope, field, raw) => onCustomChange(item.id, scope, field, raw)}
                onDelete={() => onCustomDelete(item.id)}
              />
            ))}
          </tbody>
        </table>
        <div className="token-add-row">
          <button className="token-add-btn" onClick={() => onAddCustom('spacing')}>
            + 新增 Spacing
          </button>
        </div>
      </section>

    </div>
  );
};
