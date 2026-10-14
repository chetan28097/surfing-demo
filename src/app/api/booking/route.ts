import { lessons } from "@/content/site";

type Body = Partial<Record<"lesson" | "date" | "people" | "name" | "email" | "notes", string>>;

/**
 * Booking request endpoint. Validates server-side and returns a reference.
 * INTEGRATION POINT: forward `request` to your booking system or email provider here.
 * Keep any API keys in environment variables (never in client code).
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ ok: false, error: "The request body wasn't valid JSON." }, { status: 400 });
  }

  const lesson = lessons.find((l) => l.id === body.lesson);
  const people = Number(body.people);
  const email = String(body.email ?? "").trim();
  const name = String(body.name ?? "").trim();
  const date = String(body.date ?? "");

  const problems: string[] = [];
  if (!lesson) problems.push("Choose a lesson from the list.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) problems.push("Pick a preferred date.");
  if (!Number.isInteger(people) || people < 1 || people > 6) problems.push("Group size must be 1 to 6.");
  if (!name || name.length > 120) problems.push("Add a name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) problems.push("Add a valid email address.");
  if (problems.length) return Response.json({ ok: false, error: problems.join(" ") }, { status: 422 });

  const reference = `SL-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const request = {
    reference,
    lesson: lesson!.title,
    date,
    people,
    name,
    email,
    notes: String(body.notes ?? "").slice(0, 800),
  };
  console.info("[booking] request received", { reference: request.reference, lesson: request.lesson, date });

  return Response.json({ ok: true, reference });
}
