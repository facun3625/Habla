export const POST_CATEGORIES = {
  BLOG: {
    label: 'Blog',
    slug: 'blog',
    title: 'Blog',
    description: 'Novedades, artículos y recursos sobre apraxia del habla.',
  },
  SCIENTIFIC_OUTREACH: {
    label: 'Divulgaciones científicas',
    slug: 'divulgaciones-cientificas',
    title: 'Divulgaciones científicas',
    description: 'Investigaciones y conocimiento científico explicado de forma clara y accesible.',
  },
} as const;

export type PostCategory = keyof typeof POST_CATEGORIES;
export type PostContentFormat = 'RICH_TEXT' | 'HTML';

export function isPostCategory(value: unknown): value is PostCategory {
  return typeof value === 'string' && value in POST_CATEGORIES;
}

export function normalizePostCategory(value: unknown): PostCategory {
  return isPostCategory(value) ? value : 'BLOG';
}

export function normalizePostContentFormat(value: unknown): PostContentFormat {
  return value === 'HTML' ? 'HTML' : 'RICH_TEXT';
}

export function categoryFromSlug(value: unknown): PostCategory | null {
  if (typeof value !== 'string') return null;
  const match = Object.entries(POST_CATEGORIES).find(([, item]) => item.slug === value);
  return match ? (match[0] as PostCategory) : null;
}
