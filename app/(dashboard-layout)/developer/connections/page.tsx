import type { Metadata } from "next";
import { DeveloperConnections } from "@/app/components/developer/connections";
export const metadata: Metadata = {
  title: "Developer | Connections",
  description: "Thiết lập nguồn dữ liệu GitHub, OpenAI và Claude.",
};
export default function Page() {
  return <DeveloperConnections />;
}
