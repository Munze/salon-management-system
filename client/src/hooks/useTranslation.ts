import { translations } from '../i18n/sr-Latn';

type PathsToStringProps<T> = T extends string
  ? []
  : {
      [K in keyof T]: K extends string 
        ? [K, ...PathsToStringProps<T[K]>] 
        : never;
    }[keyof T];

type Join<T extends string[], D extends string> = T extends []
  ? never
  : T extends [infer F]
  ? F extends string
    ? F
    : never
  : T extends [infer F, ...infer R]
  ? F extends string
    ? R extends string[]
      ? `${F}${D}${Join<R, D>}`
      : never
    : never
  : string;

type TranslationPath = Join<PathsToStringProps<typeof translations>, '.'>;

function getNestedValue(obj: any, path: string) {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

export function useTranslation() {
  const t = (path: TranslationPath) => {
    return getNestedValue(translations, path) || path;
  };

  return { t };
}
