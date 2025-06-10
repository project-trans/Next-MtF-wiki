"use client";
import { cache, type FC, use } from "react";
import { useTheme } from "next-themes";
import { useIsClient } from "foxact/use-is-client";

interface SuggestionBoxProps {
  attachImageButtonText?: string | undefined;
  sendButtonText?: string | undefined;
  sendingButtonText?: string | undefined;
  sentSuccessButtonText?: string | undefined;
  sentFailedButtonText?: string | undefined;
  targetUrl?: string | undefined;
  textContentPlaceholder?: string | undefined;
  contactContentPlaceholder?: string | undefined;
  style?: Record<string, string>;
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "suggestion-box": SuggestionBoxProps & HTMLAttributes<HTMLElement>;
    }
  }
}

const suggestionBoxPromise = cache(async () => {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  import("@project-trans/suggestion-box/aio");
})();

const SuggestionBox: FC<SuggestionBoxProps> = (props) => {
  const isClient = useIsClient();
  if (isClient) use(suggestionBoxPromise);
  const { resolvedTheme } = useTheme();
  return (
    <suggestion-box
      {...props}
      className={isClient && resolvedTheme === "dark" ? "dark" : ""}
      style={{
        "--c-action-bg-light": "var(--color-base-200)",
        "--c-textarea-bg-light": "var(--color-base-100)",
        "--c-contact-bg-light": "var(--color-base-100)",
      }}
      targetUrl="https://suggestion-box.project-trans.org/api/v1/suggestion"
    />
  );
};

export default SuggestionBox;
