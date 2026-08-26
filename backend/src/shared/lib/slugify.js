const DIACRITICS_REGEX = /[̀-ͯ]/g;

export const slugify = (text) =>
  (text ?? '')
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
