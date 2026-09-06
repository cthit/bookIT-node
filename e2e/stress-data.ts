import type { InputEvent, InputRule, Room } from "../frontend/src/generated/graphql";

export function stressData(now = new Date()) {
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  function dateAt(day: number) {
    const date = new Date(monday);
    date.setDate(date.getDate() + day);
    return date;
  }
  function dateText(day: number) {
    const date = dateAt(day);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  const rooms: Room[] = ["BIG_HUB", "GROUP_ROOM", "CTC", "THE_CLOUD"];
  const titles = ["Study session", "Project planning", "Committee meeting", "Workshop"];
  const events: InputEvent[] = [];

  function booking(day: number, hour: number, duration: number, title: string, room: Room[]) {
    const start = dateAt(day);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start.getTime() + duration * 3_600_000);
    events.push({
      title: `[Stress] ${title} · ${day + 1}`,
      description: "Synthetic local stress-test booking. Safe to remove with the test environment.",
      start: start.toISOString(),
      end: end.toISOString(),
      room,
      phone: "0701234567",
      booked_as: "digit",
      booking_terms: true,
    });
  }

  for (let day = 0; day < 14; day++) {
    for (const [index, room] of rooms.entries()) {
      for (const hour of [8, 10, 12, 14]) {
        booking(day, hour, 1.5, `${titles[index]} ${hour}:00`, [room]);
      }
    }
    booking(
      day,
      17,
      7,
      ["Pub preparations", "Karaoke brunch", "Milkshakepub"][day % 3]!,
      rooms.slice(0, 3),
    );
    booking(day, 18, 7, "Late-night games and society planning", ["THE_CLOUD"]);
  }

  const rules: InputRule[] = Array.from({ length: 24 }, (_, index) => ({
    title: `[Stress] ${index % 2 ? "Reading morning" : "Room maintenance"} ${index + 1}`,
    description: "Synthetic recurring rule for table pagination and layout checks.",
    start_date: dateText(index),
    end_date: dateText(index + 7),
    start_time: "06:00",
    end_time: "07:00",
    priority: index + 1,
    allow: false,
    day_mask: 127,
    room: rooms.slice(0, (index % 4) + 1),
  }));

  return { events, rules };
}
