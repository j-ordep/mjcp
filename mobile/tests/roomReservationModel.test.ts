import test from "node:test";
import assert from "node:assert/strict";
import type {
  Database,
  EventCategory as DatabaseEventCategory,
  RoomReservationStatus,
} from "../src/types/database.types";
import type { RoomReservation } from "../src/types/models";

type AssertTrue<T extends true> = T;
type IsExactly<Left, Right> = [Left] extends [Right]
  ? [Right] extends [Left]
    ? true
    : false
  : false;

type RoomReservationCategoryMatchesDatabase = AssertTrue<
  IsExactly<RoomReservation["category"], DatabaseEventCategory>
>;
type RoomReservationEventIdIsNullable = AssertTrue<
  IsExactly<RoomReservation["event_id"], string | null>
>;
type RoomReservationsTable =
  Database["public"]["Tables"]["room_reservations"];
type RoomReservationRowContract = AssertTrue<
  IsExactly<
    Pick<RoomReservationsTable["Row"], "event_id" | "category">,
    {
      event_id: string | null;
      category: DatabaseEventCategory;
    }
  >
>;
type RoomReservationInsertContract = AssertTrue<
  IsExactly<
    Pick<RoomReservationsTable["Insert"], "event_id" | "category" | "status">,
    {
      event_id?: string | null;
      category?: DatabaseEventCategory;
      status?: RoomReservationStatus;
    }
  >
>;
type RoomReservationUpdateContract = AssertTrue<
  IsExactly<
    Pick<RoomReservationsTable["Update"], "event_id" | "category" | "status">,
    {
      event_id?: string | null;
      category?: DatabaseEventCategory;
      status?: RoomReservationStatus;
    }
  >
>;
void (0 as unknown as RoomReservationCategoryMatchesDatabase);
void (0 as unknown as RoomReservationEventIdIsNullable);
void (0 as unknown as RoomReservationRowContract);
void (0 as unknown as RoomReservationInsertContract);
void (0 as unknown as RoomReservationUpdateContract);

test("RoomReservation model tracks linked event and category", () => {
  const reservation: RoomReservation = {
    id: "reservation-1",
    room_id: "room-1",
    event_id: "event-1",
    reserved_by: "user-1",
    start_at: "2026-05-02T19:00:00.000Z",
    end_at: "2026-05-02T21:00:00.000Z",
    purpose: "Reunião do louvor",
    category: "reunião",
    status: "active",
    created_at: "2026-05-01T10:00:00.000Z",
  };

  assert.equal(reservation.event_id, "event-1");
  assert.equal(reservation.category, "reunião");
});
