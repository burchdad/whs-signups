import { getPool, hasDatabaseUrl } from "./db";

const footballHomeGames = [
  ["Whitehouse vs. Chapel Hill", "Chapel Hill", "2026-08-27", "19:30", "Varsity"],
  ["Whitehouse vs. Lindale", "Lindale", "2026-09-03", "17:00", "Freshman/JV"],
  ["Whitehouse vs. Sulphur Springs", "Sulphur Springs", "2026-09-11", "19:30", "Varsity"],
  ["Whitehouse vs. Mt. Pleasant", "Mt. Pleasant", "2026-09-18", "19:30", "Varsity"],
  ["Whitehouse vs. Nacogdoches", "Nacogdoches", "2026-09-24", "17:00", "Freshman/JV"],
  ["Whitehouse vs. Greenville", "Greenville", "2026-10-08", "17:00", "Freshman/JV"],
  ["Whitehouse vs. Texas High", "Texas High", "2026-10-16", "19:30", "Varsity"],
  ["Whitehouse vs. Terrell", "Terrell", "2026-10-22", "17:00", "Freshman/JV"],
  ["Whitehouse vs. Hallsville", "Hallsville", "2026-10-30", "19:30", "Varsity"],
  ["Whitehouse vs. Marshall", "Marshall", "2026-11-05", "17:00", "Freshman/JV"],
] as const;

let scheduleReady: Promise<void> | undefined;

export function ensureKnownSchedules() {
  if (!hasDatabaseUrl()) return Promise.resolve();
  scheduleReady ??= (async () => {
    const client = await getPool().connect();
    try {
      await client.query("select pg_advisory_lock(hashtext('whssignups_known_schedules'))");
      await client.query("begin");
      const orgId = "11111111-1111-4111-8111-111111111111";
      const sport = await client.query("insert into sports (organization_id,name) values ($1,'Football') on conflict (organization_id,name) do update set name=excluded.name returning id", [orgId]);
      const season = await client.query("insert into seasons (organization_id,sport_id,name,starts_on,ends_on) values ($1,$2,'2026 Football','2026-08-01','2026-11-30') on conflict (organization_id,name) do update set sport_id=excluded.sport_id returning id", [orgId, sport.rows[0].id]);
      for (const [title, opponent, date, time, level] of footballHomeGames) {
        const offset = date >= "2026-11-01" ? "-06" : "-05";
        const startsAt = `${date} ${time}:00${offset}`;
        const slug = `whitehouse-football-vs-${opponent.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${date}`;
        const event = await client.query(`insert into events (organization_id,sport_id,season_id,title,slug,opponent,event_type,event_date,starts_at,location,description,is_published) values ($1,$2,$3,$4,$5,$6,'Home Game',$7::date,$8::timestamptz,'Wildcat Stadium',$9,true) on conflict (organization_id,slug) do update set title=excluded.title,opponent=excluded.opponent,event_date=excluded.event_date,starts_at=excluded.starts_at,location=excluded.location,description=excluded.description,is_published=true,updated_at=now() returning id`, [orgId, sport.rows[0].id, season.rows[0].id, title, slug, opponent, date, startsAt, level === "Varsity" ? "Varsity home game." : "Freshman and junior varsity home games."]);
        const eventId = event.rows[0].id;
        if (level === "Varsity") {
          await client.query("insert into event_schedule_items (event_id,label,starts_at,sort_order) select $1,'Varsity',$2::timestamptz,1 where not exists (select 1 from event_schedule_items where event_id=$1 and label='Varsity')", [eventId, startsAt]);
        } else {
          await client.query("insert into event_schedule_items (event_id,label,starts_at,sort_order) select $1,'Freshman',$2::timestamptz,1 where not exists (select 1 from event_schedule_items where event_id=$1 and label='Freshman')", [eventId, startsAt]);
          await client.query("insert into event_schedule_items (event_id,label,starts_at,sort_order) select $1,'Junior Varsity',$2::timestamptz + interval '90 minutes',2 where not exists (select 1 from event_schedule_items where event_id=$1 and label='Junior Varsity')", [eventId, startsAt]);
        }
        await client.query("insert into volunteer_slots (event_id,name,category,shift_start_at,capacity,sort_order,instructions) select $1,'Game Day Volunteer','Football Volunteers',$2::timestamptz,12,1,'Your coordinator will provide the specific assignment before game day.' where not exists (select 1 from volunteer_slots where event_id=$1)", [eventId, startsAt]);
      }
      await client.query("commit");
    } catch (error) {
      await client.query("rollback").catch(() => undefined);
      throw error;
    } finally {
      await client.query("select pg_advisory_unlock(hashtext('whssignups_known_schedules'))").catch(() => undefined);
      client.release();
    }
  })().catch((error) => { scheduleReady = undefined; throw error; });
  return scheduleReady;
}
