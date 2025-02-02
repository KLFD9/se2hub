declare module 'dompurify' {
  interface DOMPurifyI {
    sanitize(
      source: string | Node,
      config?: {
        ALLOWED_TAGS?: string[];
        ALLOWED_ATTR?: string[];
        FORBID_TAGS?: string[];
        FORBID_ATTR?: string[];
        ADD_TAGS?: string[];
        ADD_ATTR?: string[];
        USE_PROFILES?: {
          html?: boolean;
          svg?: boolean;
          svgFilters?: boolean;
          mathMl?: boolean;
        };
      }
    ): string;
  }

  const DOMPurify: DOMPurifyI;
  export default DOMPurify;
} 