import { getDemoCheckInService } from "@/lib/check-in";

export function GET() {
  return Response.json(getDemoCheckInService().getDemoData());
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    throw error;
  }

  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Request body is required." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  if (
    typeof input.code !== "string" ||
    !input.code.trim() ||
    typeof input.eventId !== "number" ||
    !Number.isInteger(input.eventId) ||
    typeof input.demoUserId !== "string" ||
    !input.demoUserId ||
    typeof input.operatorName !== "string" ||
    !input.operatorName.trim()
  ) {
    return Response.json(
      { error: "Enter your name, select a demo role and event, and provide a ticket code." },
      { status: 400 },
    );
  }

  const result = getDemoCheckInService().scan({
    code: input.code.trim(),
    eventId: input.eventId,
    demoUserId: input.demoUserId,
  });
  return Response.json(result.body, { status: result.status });
}
