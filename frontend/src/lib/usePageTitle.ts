import { useEffect } from "react";

/**
 * Sets the browser tab title to "MINDHAVEN | <title>".
 * Call inside the component of the page/route.
 */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `MINDHAVEN | ${title}` : "MINDHAVEN";
  }, [title]);
}

