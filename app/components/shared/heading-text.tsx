import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import AnimatedTextGradientMotion from "@/components/shadcn-dashboard/animated-text/animated-text-02";

/** Decorate title text while preserving icons, actions and composed headings. */
export function HeadingText({ children }: { children: ReactNode }) {
  const content: ReactNode[] = [];
  let text = "";
  function flushText() {
    if (!text) return;
    content.push(text.trim() ? (
      <AnimatedTextGradientMotion key={`text-${content.length}`}>
        {text}
      </AnimatedTextGradientMotion>
    ) : text);
    text = "";
  }
  for (const child of Children.toArray(children)) {
    if (typeof child === "string" || typeof child === "number") {
      text += child;
      continue;
    }
    flushText();
    if (
      isValidElement<{ children?: ReactNode }>(child) &&
      typeof child.type === "string" &&
      /^(h[1-6]|span|div)$/.test(child.type) &&
      child.props.children != null
    ) {
      content.push(cloneElement(child, undefined, <HeadingText>{child.props.children}</HeadingText>));
    } else {
      content.push(child);
    }
  }
  flushText();
  return <>{content}</>;
}
