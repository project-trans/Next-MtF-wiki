export interface SuggestionBoxProps {
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

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'suggestion-box': SuggestionBoxProps & HTMLAttributes<HTMLElement>;
    }
  }
}
