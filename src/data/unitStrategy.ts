import type { UnitStrategy, UnitStrategyCategory, PropertyType } from '../types';

// ─────────────────────────────────────────────
// Unit Strategy Data
//
// Single source of truth for CSS unit recommendations.
// Used by the tool's inspector/hint layer and the UNIT_STRATEGY.md spec.
// ─────────────────────────────────────────────

export const UNIT_STRATEGIES: readonly UnitStrategy[] = [

  // ── Typography-relative ──────────────────────────────────────────────

  {
    property: 'font-size',
    label: 'Font Size',
    category: 'typography-relative',
    recommendedUnits: ['rem'],
    allowedUnits: ['rem', 'clamp()'],
    avoidUnits: ['px', 'em'],
    supportsClamp: true,
    clampPolicy: 'always',
    reason:
      'rem 跟隨使用者的根字級偏好縮放，確保可及性（accessibility）。' +
      'px 會忽略使用者在瀏覽器中設定的字級偏好，違反 WCAG 1.4.4。' +
      'em 容易因巢狀結構造成複合縮放，維護成本高。',
    notes:
      '做響應式時可輸出 clamp()，但 min/max 值仍建議用 rem 表示，' +
      '確保使用者縮放時上下限也隨之調整。' +
      'clamp() 的 fluid 中間值可用 vw 或 calc(rem + vw)。',
    examples: [
      'font-size: 1rem;',
      'font-size: 1.25rem;',
      'font-size: clamp(1rem, 0.875rem + 0.5vw, 1.5rem);',
      'font-size: clamp(1rem, calc(0.9rem + 1vw), 1.25rem);',
    ],
  },

  {
    property: 'padding',
    label: 'Padding',
    category: 'typography-relative',
    recommendedUnits: ['rem'],
    allowedUnits: ['rem', 'clamp()', '%'],
    avoidUnits: ['px'],
    supportsClamp: true,
    clampPolicy: 'large-only',
    reason:
      'rem 讓元件內部留白隨字級保持比例，維持閱讀節奏的一致性。' +
      '當使用者放大字級，padding 同步放大，不會讓文字擠壓。',
    notes:
      '元件內部的小型 padding（button、input）優先 rem；' +
      '大型 section 或 hero 的 padding-block 可用 clamp() 做 viewport 響應。' +
      '水平 padding-inline 通常用 rem 配合容器寬度策略。',
    examples: [
      'padding: 1rem;',
      'padding: 0.75rem 1.25rem;',
      'padding-block: clamp(2.5rem, 1rem + 4vw, 7rem);',
      'padding-inline: clamp(1rem, 3vw, 3rem);',
    ],
  },

  {
    property: 'margin',
    label: 'Margin',
    category: 'typography-relative',
    recommendedUnits: ['rem'],
    allowedUnits: ['rem', 'clamp()', 'auto'],
    avoidUnits: ['px'],
    supportsClamp: true,
    clampPolicy: 'large-only',
    reason:
      '一般 block 間距優先 rem，維持排版節奏與字級的比例關係。' +
      '大型區塊間距（section 之間）可搭配 clamp()，讓版面在不同螢幕下保持視覺平衡。',
    notes:
      'margin: auto 用於水平置中，不受此規則限制。' +
      'margin-block 通常比 margin-inline 更需要 clamp()，因為垂直節奏受 viewport 高度影響更大。',
    examples: [
      'margin-bottom: 1rem;',
      'margin-block: clamp(2rem, 1rem + 3vw, 5rem);',
      'margin-inline: auto;',
    ],
  },

  {
    property: 'gap',
    label: 'Gap',
    category: 'typography-relative',
    recommendedUnits: ['rem'],
    allowedUnits: ['rem', 'clamp()'],
    avoidUnits: ['px'],
    supportsClamp: true,
    clampPolicy: 'large-only',
    reason:
      'rem 讓 flex/grid 間距隨字級縮放，維持內容節奏。' +
      '文字排版相關的 gap（例如 article 內的段落間距）特別需要跟隨字級。',
    notes:
      '小型 UI 元件的 gap（icon + label、按鈕排列）可視情況用 px 取得精確控制。' +
      '大型 grid gap（section 格線）可用 clamp()。',
    examples: [
      'gap: 1rem;',
      'gap: 0.5rem 1rem;',
      'gap: clamp(1.5rem, 1rem + 2vw, 4rem);',
    ],
  },

  // ── Layout-relative ──────────────────────────────────────────────────

  {
    property: 'max-width',
    label: 'Max Width',
    category: 'layout-relative',
    recommendedUnits: ['rem', '%'],
    allowedUnits: ['rem', '%', 'min()', 'clamp()'],
    avoidUnits: ['px'],
    supportsClamp: false,
    clampPolicy: 'avoid',
    reason:
      'rem 讓閱讀寬度與字級保持合理比例（中文約 35–45 字元，英文約 60–75 字元每行）。' +
      '% 讓容器在小螢幕仍保有彈性。' +
      '混合策略 min(100% - 2rem, 75rem) 同時兼顧最大寬度與行動版邊距。',
    notes:
      '不建議只用固定 px，因為字級放大後閱讀寬度比例會偏窄。' +
      'min() 是最推薦的容器寬度寫法，可替代 max-width + padding-inline 的組合。',
    examples: [
      'max-width: 75rem;',
      'width: min(100% - 2rem, 75rem);',
      'width: min(100% - 3rem, 90rem);',
      'width: min(100% - clamp(2rem, 5vw, 6rem), 80rem);',
    ],
  },

  {
    property: 'section-spacing',
    label: 'Section / Hero Spacing',
    category: 'layout-relative',
    recommendedUnits: ['clamp()'],
    allowedUnits: ['clamp()', 'rem', '%'],
    avoidUnits: ['px'],
    supportsClamp: true,
    clampPolicy: 'always',
    reason:
      '大型版面間距需要在手機與桌面之間流暢縮放。' +
      '固定 px 或 rem 會讓行動版留白過大，或桌面版留白不足。' +
      'clamp() 讓設計師直接定義「最小留白」與「最大留白」，中間由 viewport 自動插值。',
    notes:
      '適用於 section padding-block、hero 高度、大型 block gap、feature grid 間距。' +
      '行動版最小值通常 2–3rem，桌面最大值通常 5–10rem。',
    examples: [
      'padding-block: clamp(2.5rem, 1rem + 4vw, 7rem);',
      'padding-block: clamp(3rem, 2rem + 5vw, 10rem);',
      'margin-block: clamp(4rem, 2rem + 6vw, 12rem);',
    ],
  },

  // ── Visual-fixed ─────────────────────────────────────────────────────

  {
    property: 'border-width',
    label: 'Border Width',
    category: 'visual-fixed',
    recommendedUnits: ['px'],
    allowedUnits: ['px'],
    avoidUnits: ['rem', 'em', '%'],
    supportsClamp: false,
    clampPolicy: 'avoid',
    reason:
      '線條是純視覺細節，不應隨字級或 viewport 縮放。' +
      '1px 的 hairline 若用 rem，在字級放大時會變成 1.5–2px，破壞視覺語言。',
    notes:
      'hairline / divider 固定 1px。' +
      '特殊強調邊框（focus ring、選取框）可用 2px。' +
      'outline 與 box-shadow 也適用同樣規則。',
    examples: [
      'border: 1px solid var(--color-border);',
      'border-width: 2px;',
      'outline: 2px solid var(--color-focus);',
      'box-shadow: 0 0 0 1px var(--color-border);',
    ],
  },

  {
    property: 'border-radius',
    label: 'Border Radius — 小型元件',
    variant: 'small',
    category: 'visual-fixed',
    recommendedUnits: ['px'],
    allowedUnits: ['px'],
    avoidUnits: ['rem', 'em', '%'],
    supportsClamp: false,
    clampPolicy: 'avoid',
    reason:
      '小型元件的圓角是設計系統視覺語言的一部分，固定 px 確保設計一致性。' +
      '若用 rem，字級放大後圓角也跟著放大，button 會顯得過圓。',
    notes:
      '適用範圍：button、input、select、badge、tag、chip、small card、tooltip。' +
      '建議設計 token 範圍：4px（緊湊）、6px（預設）、8px（柔和）。',
    examples: [
      'border-radius: 4px;',
      'border-radius: 6px;',
      'border-radius: 8px;',
    ],
  },

  {
    property: 'border-radius',
    label: 'Border Radius — 大型容器',
    variant: 'large',
    category: 'visual-fixed',
    recommendedUnits: ['rem'],
    allowedUnits: ['rem', 'px'],
    avoidUnits: ['%'],
    supportsClamp: true,
    clampPolicy: 'large-only',
    reason:
      '大型容器的圓角可稍微隨字級彈性調整，rem 讓視覺比例更自然。' +
      '固定 px 在大型容器上也可接受，視設計系統而定。',
    notes:
      '適用範圍：large card、modal、dialog、drawer、bottom sheet、panel。' +
      '避免使用 50% 或過大的 px（如 9999px），除非明確要做「藥丸形」設計。',
    examples: [
      'border-radius: 1rem;',
      'border-radius: 1.5rem;',
      'border-radius: 2rem;',
      'border-radius: 16px; /* acceptable if design token is px-based */',
    ],
  },

] as const;

// ── Lookup helpers ─────────────────────────────────────────────────────

/** Get strategy for a property. If a property has variants (e.g. border-radius), returns the first match. */
export function getUnitStrategy(property: string, variant?: string): UnitStrategy | undefined {
  return UNIT_STRATEGIES.find(
    (s) => s.property === property && (variant === undefined || s.variant === variant),
  );
}

/** Get all strategies for a given category */
export function getStrategiesByCategory(category: UnitStrategyCategory): UnitStrategy[] {
  return UNIT_STRATEGIES.filter((s) => s.category === category);
}

/** Get all strategies for a property (covers multi-variant cases like border-radius) */
export function getAllStrategiesForProperty(property: string): UnitStrategy[] {
  return UNIT_STRATEGIES.filter((s) => s.property === property);
}

/** Human-readable category labels */
export const CATEGORY_LABELS: Record<UnitStrategyCategory, string> = {
  'typography-relative': 'Typography-relative',
  'layout-relative': 'Layout-relative',
  'visual-fixed': 'Visual-fixed',
};

/** Maps tool PropertyType to the unitStrategy property key */
const PROPERTY_TYPE_TO_STRATEGY: Record<PropertyType, string> = {
  'font-size': 'font-size',
  'spacing': 'padding',
};

/** Get the UnitStrategy for a tool PropertyType */
export function getStrategyForPropertyType(pt: PropertyType): UnitStrategy | undefined {
  return getUnitStrategy(PROPERTY_TYPE_TO_STRATEGY[pt]);
}

/** Short descriptions for each category */
export const CATEGORY_DESCRIPTIONS: Record<UnitStrategyCategory, string> = {
  'typography-relative': '與文字節奏、內容閱讀、內部留白有關，跟隨使用者字級縮放。建議單位：rem、clamp()',
  'layout-relative': '與版面寬度、大型區塊節奏有關，兼顧閱讀寬度與 viewport 變化。建議單位：rem、%、clamp()、min()',
  'visual-fixed': '純視覺細節，不應隨文字縮放。建議單位：px',
};
