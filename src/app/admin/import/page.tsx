import { requireAdmin } from "@/lib/auth";
import { getTemplates } from "@/lib/repository";
import { sportsOffered } from "@/lib/sports";
import { ScheduleImporter } from "./schedule-importer";

export const metadata = { title: "Import Schedule" };

export default async function ImportPage() {
  await requireAdmin();
  const templates = await getTemplates();
  return <ScheduleImporter sports={[...sportsOffered]} templates={templates.map(({ id, name }) => ({ id, name }))} />;
}
