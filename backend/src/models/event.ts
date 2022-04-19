import { PartyReport } from "./party_report";
import { Room } from "./room";

export interface Event {
  id: string | null;
  start: string;
  end: string;
  description: string | null;
  title: string;
  created_at: string;
  updated_at: string;
  party_report?: PartyReport;
  party_report_id?: string;
  room: Room[];
  phone: string;
  booked_by: string;
  booked_as: string;
}
