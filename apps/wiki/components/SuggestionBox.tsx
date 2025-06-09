"use client";
import { cache, type FC, type HTMLAttributes, use } from "react";
import { useTheme } from "next-themes";
import { useIsClient } from "foxact/use-is-client";

interface SuggestionBoxProps extends HTMLAttributes<HTMLElement> {
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
  import("@project-trans/suggestion-box/aio");
})();

const SuggestionBox: FC<SuggestionBoxProps> = (props) => {
  const isClient = useIsClient();
  if (isClient) use(suggestionBoxPromise);
  const { resolvedTheme } = useTheme();
  return (
    <suggestion-box
      className={isClient && resolvedTheme === "dark" ? "dark" : ""}
      {...props}
    />
  );
};

export default SuggestionBox;
