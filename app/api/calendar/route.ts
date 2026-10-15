import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { withCalendar } from "@/lib/calendar/store";
import { parseEvent, parseSettings } from "@/lib/calendar/validation";

const invalid = () =>
  NextResponse.json({ message: "Invalid calendar input" }, { status: 400 });
const failure = (error: unknown) => {
  console.error("Calendar storage error:", error);
  return NextResponse.json(
    { message: "Calendar storage unavailable" },
    { status: 500 },
  );
};
export async function GET() {
  try {
    return NextResponse.json(await withCalendar((data) => data), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalid();
  }
  const event = parseEvent(body);
  if (!event) return invalid();
  try {
    return NextResponse.json(
      await withCalendar((data) => {
        data.events.push({ ...event, id: randomUUID() });
        return data;
      }, true),
      { status: 201 },
    );
  } catch (error) {
    return failure(error);
  }
}
export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalid();
  }
  const event = parseEvent(body);
  const id =
    typeof body === "object" && body !== null && "id" in body ? body.id : null;
  if (!event || typeof id !== "string") return invalid();
  try {
    const data = await withCalendar((data) => {
      const index = data.events.findIndex((e) => e.id === id);
      if (index === -1) return null;
      data.events[index] = { ...event, id };
      return data;
    }, true);
    return data
      ? NextResponse.json(data)
      : NextResponse.json({ message: "Event not found" }, { status: 404 });
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(request: Request) {
  let body: { id?: unknown };
  try {
    body = await request.json();
  } catch {
    return invalid();
  }
  if (!body || typeof body.id !== "string") return invalid();
  try {
    const data = await withCalendar((data) => {
      const index = data.events.findIndex((e) => e.id === body.id);
      if (index === -1) return null;
      data.events.splice(index, 1);
      return data;
    }, true);
    return data
      ? NextResponse.json(data)
      : NextResponse.json({ message: "Event not found" }, { status: 404 });
  } catch (error) {
    return failure(error);
  }
}
export async function PATCH(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalid();
  }
  const settings = parseSettings(body);
  if (!settings) return invalid();
  try {
    return NextResponse.json(
      await withCalendar((data) => {
        data.settings = settings;
        return data;
      }, true),
    );
  } catch (error) {
    return failure(error);
  }
}
