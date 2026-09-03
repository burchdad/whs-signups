import type { AdminSignupRow } from "./types";

export type AdminSignupFilters = {
  q: string;
  sport: string;
  event: string;
  position: string;
  status: string;
  from: string;
  to: string;
};

type QueryValue = string | string[] | undefined;

function first(value: QueryValue) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export function parseAdminSignupFilters(values: Record<string, QueryValue> | URLSearchParams): AdminSignupFilters {
  const get = (key: string) => values instanceof URLSearchParams ? values.get(key) ?? "" : first(values[key]);
  return { q: get("q"), sport: get("sport"), event: get("event"), position: get("position"), status: get("status"), from: get("from"), to: get("to") };
}

export function filterAdminSignups(signups: AdminSignupRow[], filters: AdminSignupFilters) {
  const query = filters.q.toLocaleLowerCase();
  return signups.filter((signup) => {
    const searchable = [signup.firstName, signup.lastName, signup.email, signup.phone, signup.eventTitle, signup.eventDate, signup.slotName, signup.studentName, signup.notes].filter(Boolean).join(" ").toLocaleLowerCase();
    return (!query || searchable.includes(query))
      && (!filters.sport || signup.sport === filters.sport)
      && (!filters.event || signup.eventId === filters.event)
      && (!filters.position || signup.slotName === filters.position)
      && (!filters.status || signup.status === filters.status)
      && (!filters.from || signup.eventDate >= filters.from)
      && (!filters.to || signup.eventDate <= filters.to);
  });
}

export function adminSignupFilterQuery(filters: AdminSignupFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
  return params.toString();
}
