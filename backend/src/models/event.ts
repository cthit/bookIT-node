import { room } from "@prisma/client";

export interface Event {
  id: string | null;
  start: string;
  end: string;
  description: string | null;
  title: string;
  created_at: string;
  updated_at: string;
  room: room[];
  phone: string;
  booked_by: string;
  booked_as: string;
  booking_terms: boolean;
}
