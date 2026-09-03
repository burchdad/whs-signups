import type { AdminSignupRow } from "./types";

export type AdminSignupFilters = {
  q: string;
  sports: string[];
  events: string[];
  positions: string[];
  statuses: string[];
  from: string;
  to: string;
  sort: AdminSignupSort | "";
  direction: "asc" | "desc";
};

export type AdminSignupSort = "volunteer" | "event" | "position" | "email" | "eventDate";

const sortableColumns = new Set<AdminSignupSort>(["volunteer", "event", "position", "email", "eventDate"]);
const signupCollator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

type QueryValue = string | string[] | undefined;

function first(value: QueryValue) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function many(value: QueryValue) {
  return [...new Set((Array.isArray(value) ? value : value ? [value] : []).map((item) => item.trim()).filter(Boolean))];
}

export function parseAdminSignupFilters(values: Record<string, QueryValue> | URLSearchParams): AdminSignupFilters {
  const get = (key: string) => values instanceof URLSearchParams ? values.get(key)?.trim() ?? "" : first(values[key]);
  const getAll = (key: string) => values instanceof URLSearchParams ? [...new Set(values.getAll(key).map((item) => item.trim()).filter(Boolean))] : many(values[key]);
  const requestedSort = get("sort") as AdminSignupSort;
  return { q: get("q"), sports: getAll("sport"), events: getAll("event"), positions: getAll("position"), statuses: getAll("status"), from: get("from"), to: get("to"), sort: sortableColumns.has(requestedSort) ? requestedSort : "", direction: get("direction") === "desc" ? "desc" : "asc" };
}

export function filterAdminSignups(signups: AdminSignupRow[], filters: AdminSignupFilters) {
  const query = filters.q.toLocaleLowerCase();
  const filtered = signups.filter((signup) => {
    const searchable = [signup.firstName, signup.lastName, signup.email, signup.phone, signup.eventTitle, signup.eventDate, signup.slotName, signup.studentName, signup.notes].filter(Boolean).join(" ").toLocaleLowerCase();
    return (!query || searchable.includes(query))
      && (filters.sports.length === 0 || filters.sports.includes(signup.sport))
      && (filters.events.length === 0 || filters.events.includes(signup.eventId))
      && (filters.positions.length === 0 || filters.positions.includes(signup.slotName))
      && (filters.statuses.length === 0 || filters.statuses.includes(signup.status))
      && (!filters.from || signup.eventDate >= filters.from)
      && (!filters.to || signup.eventDate <= filters.to);
  });
  if (!filters.sort) return filtered;
  const value = (signup: AdminSignupRow) => {
    if (filters.sort === "volunteer") return `${signup.lastName}, ${signup.firstName}`;
    if (filters.sort === "event") return signup.eventTitle;
    if (filters.sort === "position") return signup.slotName;
    if (filters.sort === "email") return signup.email;
    return signup.eventDate;
  };
  const multiplier = filters.direction === "desc" ? -1 : 1;
  return filtered.sort((left, right) => (signupCollator.compare(value(left), value(right)) || signupCollator.compare(left.id, right.id)) * multiplier);
}

export function adminSignupFilterQuery(filters: AdminSignupFilters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  for (const sport of filters.sports) params.append("sport", sport);
  for (const event of filters.events) params.append("event", event);
  for (const position of filters.positions) params.append("position", position);
  for (const status of filters.statuses) params.append("status", status);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.sort) {
    params.set("sort", filters.sort);
    params.set("direction", filters.direction);
  }
  return params.toString();
}
