import { requireAdmin } from "@/lib/auth";
import { getTemplates } from "@/lib/repository";
import { participationAreas } from "@/lib/sports";
import { ScheduleImporter } from "./schedule-importer";

export const metadata = { title: "Import Schedule" };

export default async function ImportPage() {
  const session = await requireAdmin();
  const templates = await getTemplates();
  const sports = session.allowedSports === null ? [...participationAreas] : participationAreas.filter((sport) => session.allowedSports?.includes(sport));
  return <ScheduleImporter sports={sports} templates={templates.map(({ id, name }) => ({ id, name }))} />;
}
