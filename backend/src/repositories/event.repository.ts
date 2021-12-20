import { Event } from "../models/event";
import pg from "pg";
import { Error } from "../models";
import { to } from "../utils";

export const getEvents = (db: pg.Pool): Promise<pg.QueryResult<Event[]>> =>
  db.query<Event[]>(
    "SELECT id, party_report_id, start, end_date as end, phone,\
    description, title, created_at, updated_at, room, booked_by, booked_as\
    FROM event",
  );

export const getPartyEvents = (db: pg.Pool): Promise<pg.QueryResult<Event>> =>
  db.query<Event>(
    "SELECT id, party_report_id, start, end_date as end, phone,\
    description, title, created_at, updated_at, room, booked_by, booked_as\
    FROM event WHERE party_report_id IS NOT NULL",
  );

export const getEventsFT = (
  db: pg.Pool,
  from: string,
  to: string,
): Promise<pg.QueryResult<Event[]>> =>
  db.query<Event[]>(
    "SELECT id, party_report_id, start, end_date as end,\
    description, title, created_at, updated_at, room, phone, \
    booked_by, booked_as FROM event \
    WHERE $1 <= end_date AND $2 >= start",
    [from, to],
  );

export const getEvent = (
  db: pg.Pool,
  id: string,
): Promise<pg.QueryResult<Event>> =>
  db.query<Event>(
    "SELECT id, party_report_id, start, end_date as end,\
    description, title, created_at, updated_at, room, phone, \
    booked_by, booked_as FROM event WHERE id=$1",
    [id],
  );

export const createEvent = (db: pg.Pool, event: Event) =>
  db.query(
    "INSERT INTO event (start, party_report_id, end_date, description,\
    title, room, phone, booked_by, booked_as) \
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    [
      event.start,
      event.party_report_id,
      event.end,
      event.description,
      event.title,
      event.room,
      event.phone,
      event.booked_by,
      event.booked_as,
    ],
  );

export const getOverlapEvent = (
  db: pg.Pool,
  { start, end, room, id }: Event,
): Promise<pg.QueryResult<Event>> =>
  db.query(
    "SELECT id, party_report_id, start, end_date as end,\
    description, title, created_at, updated_at, room, \
    booked_by, booked_as FROM event \
    WHERE $1 < end_date AND $2 > start AND $3 && room AND id != $4",
    [start, end, room, id],
  );

export const editEvent = (
  db: pg.Pool,
  event: Event,
): Promise<pg.QueryResult<Event>> =>
  db.query(
    "UPDATE event SET start=$1, end_date=$2, description=$3,\
    title=$4, room=$5, phone=$6, booked_by=$7, booked_as=$8, \
    party_report_id=$9 WHERE id=$10",
    [
      event.start,
      event.end,
      event.description,
      event.title,
      event.room,
      event.phone,
      event.booked_by,
      event.booked_as,
      event.party_report_id,
      event.id,
    ],
  );

export const deleteEvent = async (
  db: pg.Pool,
  id: string,
  mayDelete: (group: string) => boolean,
): Promise<Error | null> => {
  let res,
    err = null;
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    res = await client.query(
      "SELECT party_report_id, booked_as FROM event WHERE id=$1",
      [id],
    );

    if (res.rowCount < 1) {
      await client.query("ROLLBACK");
      return {
        sv: "Hittade inte bokningen",
        en: "The event was not found",
      };
    }

    if (!mayDelete(res.rows[0].booked_as)) {
      await client.query("ROLLBACK");
      return {
        sv: "Du får ej radera denna bokning",
        en: "You may not delete this booking",
      };
    }

    if (res.rowCount > 0 && res.rows[0].party_report_id) {
      await client.query("DELETE FROM party_report WHERE id=$1", [
        res.rows[0].party_report_id,
      ]);
    }

    await client.query("DELETE FROM event WHERE id=$1", [id]);

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  return null;
};
