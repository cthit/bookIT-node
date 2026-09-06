import { test, expect, loginAs } from "./fixtures";
import { bookingDate, createBooking, graphql, openBooking } from "./booking-helpers";
import type {
  CurrentUserQuery,
  DeleteBookingMutation,
  CreateBookingMutation,
  CreateRuleMutation,
  BookingDetailQuery,
} from "../frontend/src/generated/graphql";

test("Gamma membership controls the UI and the API rejects a forged group booking", async ({
  page,
  environment,
}) => {
  await createBooking(page, "E2E protected group booking");
  const id = await openBooking(page, "E2E protected group booking");
  await loginAs(page, environment, "outsider");
  const identity = await graphql<CurrentUserQuery>(page, "{ user { sub cid groups is_admin } }");
  expect(identity.user?.cid).toBe("bookguest");
  expect(identity.user?.groups).toEqual([]);
  expect(identity.user?.is_admin).toBe(false);

  await page.goto("/new-event");
  await expect(page.getByRole("alert")).toHaveText(
    "You need membership in an active group to make a booking.",
  );
  await expect(page.getByRole("button", { name: "Save booking", exact: true })).toHaveCount(0);
  await page.goto("/rules");
  await expect(page.getByRole("heading", { name: "Rules", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "New rule", exact: true })).toHaveCount(0);
  await page.goto(`/bookings/${id}`);
  await expect(
    page.getByRole("heading", { name: "E2E protected group booking", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toHaveCount(0);

  const deletion = await graphql<DeleteBookingMutation>(
    page,
    "mutation($id: String!) { deleteEvent(id: $id) { en sv } }",
    { id },
  );
  expect(deletion.deleteEvent?.en).toBe("You may not delete this event");
  const date = await bookingDate(page);
  const forged = await graphql<CreateBookingMutation>(
    page,
    "mutation($event: InputEvent!) { createEvent(event: $event) { en sv } }",
    {
      event: {
        title: "Forged booking",
        phone: "0701234567",
        start: `${date}T15:00:00.000Z`,
        end: `${date}T16:00:00.000Z`,
        room: ["CTC"],
        booked_as: "digit",
        booking_terms: true,
      },
    },
  );
  expect(forged.createEvent?.en).toBe("Booking group not specified");
  const rule = await graphql<CreateRuleMutation>(
    page,
    "mutation($rule: InputRule!) { createRule(rule: $rule) { en sv } }",
    {
      rule: {
        title: "Forged rule",
        description: "",
        start_date: date,
        end_date: date,
        start_time: "12:00",
        end_time: "13:00",
        day_mask: 127,
        room: ["BIG_HUB"],
        allow: false,
      },
    },
  );
  expect(rule.createRule?.en).toBe("You do not have permission to create rules");
  const unchanged = await graphql<BookingDetailQuery>(
    page,
    "query($id: String!) { event(id: $id) { id title } }",
    { id },
  );
  expect(unchanged.event?.title).toBe("E2E protected group booking");
});
