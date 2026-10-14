import { randomBytes } from 'crypto';

export function slugifyTalkTitle(title: string) {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 54) || 'charla';
}

export function newTalkToken() {
  return randomBytes(9).toString('base64url');
}

export function talkPublicPath(slug: string, token: string) {
  return `/charla/${slug}/${token}`;
}
