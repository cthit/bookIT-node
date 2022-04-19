import { Event } from "./event";

export interface PartyReport {
  id: string | null;
  responsible_name: string;
  responsible_number: string;
  responsible_email: string;
  co_responsible_name: string | null;
  co_responsible_number: string | null;
  co_responsible_email: string | null;
  serving_permit: boolean | null;
  status?: string | null;
}
