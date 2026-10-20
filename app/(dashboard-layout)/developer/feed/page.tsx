import type { Metadata } from "next";
import { DeveloperFeed } from "@/app/components/developer/feed";
import { DeveloperFeedProvider } from "@/app/context/developer-feed-context";
export const metadata: Metadata = {
  title: "Developer Feed | Personal Dashboard",
  description:
    "A curated developer reading space with a sample morning briefing.",
};
export default function Page() {
  return (
    <DeveloperFeedProvider>
      <DeveloperFeed />
    </DeveloperFeedProvider>
  );
}
