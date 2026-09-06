import type { Room } from "@/generated/graphql";

export const rooms: { id: Room; name: string; color: string }[] = [
  {
    id: "BIG_HUB",
    name: "Storhubben",
    color: "#087783",
  },
  {
    id: "GROUP_ROOM",
    name: "Grupprummet",
    color: "#AD600D",
  },
  { id: "CTC", name: "CTC", color: "#A63446" },
  { id: "THE_CLOUD", name: "The Cloud", color: "#35735A" },
];

export function roomName(id: Room) {
  return rooms.find((room) => room.id === id)?.name ?? id;
}
