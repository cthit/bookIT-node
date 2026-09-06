import type { Room } from "@/generated/graphql";

export const rooms: { id: Room; name: string; color: string }[] = [
  {
    id: "BIG_HUB",
    name: "Storhubben",
    color: "#0C6291",
  },
  {
    id: "GROUP_ROOM",
    name: "Grupprummet",
    color: "#E28413",
  },
  { id: "CTC", name: "CTC", color: "#A63446" },
  { id: "THE_CLOUD", name: "The Cloud", color: "#3F784C" },
];

export function roomName(id: Room) {
  return rooms.find((room) => room.id === id)?.name ?? id;
}
