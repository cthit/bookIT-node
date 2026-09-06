import type { InputEvent } from "../generated/schema";

export interface Event extends InputEvent {
  booked_by: string;
}
