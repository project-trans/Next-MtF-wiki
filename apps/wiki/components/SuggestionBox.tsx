"use client";
import { cache, type FC, use } from "react";

interface SuggestionBoxProps {
  attachImageButtonText?: string | undefined;
  sendButtonText?: string | undefined;
  sendingButtonText?: string | undefined;
  sentSuccessButtonText?: string | undefined;
  sentFailedButtonText?: string | undefined;
  targetUrl?: string | undefined;
  textContentPlaceholder?: string | undefined;
  contactContentPlaceholder?: string | undefined;
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "suggestion-box": SuggestionBoxProps;
    }
  }
}

const suggestionBoxPromise = cache(async () => {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  return import("@project-trans/suggestion-box/aio");
})();

const SuggestionBox: FC<SuggestionBoxProps> = (props) => {
  use(suggestionBoxPromise);
  return <suggestion-box {...props} />;
};

export default SuggestionBox;
