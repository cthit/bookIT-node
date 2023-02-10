import { Room } from "./room";

export interface Event {
  id: string | null;
  start: string;
  end: string;
  description: string | null;
  title: string;
  created_at: string;
  updated_at: string;
  room: Room[];
  phone: string;
  booked_by: string;
  booked_as: string;
  booking_terms: boolean;
}
