import type { Room } from "@/generated/graphql";
import { rooms } from "./rooms";

export function bookingRoomClass(selected: readonly (Room | null)[]) {
  const mask = rooms.reduce(
    (value, room, index) => value | (selected.includes(room.id) ? 1 << index : 0),
    0,
  );
  const multiple = mask !== 0 && (mask & (mask - 1)) !== 0;
  return `booking-rooms-${mask}${multiple ? " booking-multi-room" : ""}`;
}

export const bookingRoomStyles = Array.from({ length: (1 << rooms.length) - 1 }, (_, index) => {
  const mask = index + 1;
  const colors = rooms.filter((_, bit) => mask & (1 << bit)).map((room) => room.color);
  const stops = colors
    .map((color, stop) => `${color} ${stop * 25}px ${(stop + 1) * 25}px`)
    .join(", ");
  return `.booking-rooms-${mask} { --booking-stripes: repeating-linear-gradient(45deg, ${stops}); }`;
}).join("\n");
