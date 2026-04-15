import { DashboardShellClient } from "@/components/dashboard/dashboard-shell-client";
import {
  initialLayouts,
  initialProfiles,
  publicFeedCatalog,
  themeDefinitions,
} from "@/lib/dashboard-data";

export default function Home() {
  return (
    <DashboardShellClient
      initialLayouts={initialLayouts}
      initialProfiles={initialProfiles}
      publicFeedCatalog={publicFeedCatalog}
      themeDefinitions={themeDefinitions}
    />
  );
}
