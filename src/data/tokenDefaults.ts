import type { TokenValueMap, TypographyTokenKey, SpacingTokenKey, ResponsiveTokenValue } from '../types';

export const TYPOGRAPHY_TOKEN_KEYS: TypographyTokenKey[] = [
  '.txt-wrap',
  '.txt-title',
  '.page-en-title',
  '.page-zh-title',
  '.page-en-subtitle',
  '.page-zh-subtitle',
  '.page-en-label',
  '.page-zh-label',
  '.txt-body',
  '.txt-body p',
  '.page-caption',
  '.slogan-wrap',
  '.page-slogan-heading1',
  '.page-slogan-heading2',
  '.page-slogan-heading3',
  '.page-slogan-label',
];

export const WRAPPER_TYPOGRAPHY_KEYS = new Set<TypographyTokenKey>([
  '.txt-wrap',
  '.txt-title',
  '.txt-body',
  '.slogan-wrap',
]);

export const SPACING_TOKEN_KEYS: SpacingTokenKey[] = [
  '--section-padding-px',
  '--section-padding-py',
  '--section-gutter-y',
  '--section-gutter-x',
  '--text-stack-gap',
];

function makeToken(
  key: ResponsiveTokenValue['key'],
  category: ResponsiveTokenValue['category'],
): ResponsiveTokenValue {
  return {
    key,
    category,
    mobile: { minWidth: 390, maxWidth: 991, minPx: '', maxPx: '' },
    desktop: { minWidth: 992, maxWidth: 1920, minPx: '', maxPx: '' },
  };
}

export function buildDefaultTokenMap(): TokenValueMap {
  const map = {} as TokenValueMap;
  for (const key of TYPOGRAPHY_TOKEN_KEYS) map[key] = makeToken(key, 'typography');
  for (const key of SPACING_TOKEN_KEYS) map[key] = makeToken(key, 'spacing');
  return map;
}
