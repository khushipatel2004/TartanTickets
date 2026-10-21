// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Story 6: Check-in", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("test_valid_scan_checks_in: marks a valid ticket used and shows the attendee", async () => {
    const { createCheckInService } = await import("./check-in");
    const service = createCheckInService();
    const ticket = service.getTickets()[0];

    const result = service.scan({
      code: ticket.code,
      eventId: ticket.eventId,
      demoUserId: "officer-sound",
      operatorName: "Demo Officer",
    });

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({
      status: "checked-in",
      attendeeName: ticket.attendeeName,
    });
    expect(service.getTickets()[0].checkedInAt).toBeTruthy();
  });

  it("test_duplicate_scan_shows_already_used: rejects a second scan with the first scan time", async () => {
    const { createCheckInService } = await import("./check-in");
    const service = createCheckInService();
    const ticket = service.getTickets()[0];
    const first = service.scan({
      code: ticket.code,
      eventId: ticket.eventId,
      demoUserId: "officer-sound",
    });

    const second = service.scan({
      code: ticket.code,
      eventId: ticket.eventId,
      demoUserId: "officer-sound",
    });

    expect(second.status).toBe(409);
    expect(second.body).toMatchObject({
      status: "already-used",
      checkedInAt: first.body.checkedInAt,
    });
  });

  it("test_invalid_wrong_event_refunded_scans_rejected: rejects invalid, wrong-event, and refunded codes without changing ticket states", async () => {
    const { createCheckInService } = await import("./check-in");
    const service = createCheckInService();
    const [validTicket, wrongEventTicket, refundedTicket] = service.getTickets();
    const before = service.getTickets().map((ticket) => ticket.checkedInAt);

    expect(
      service.scan({
        code: "not-a-ticket",
        eventId: validTicket.eventId,
        demoUserId: "officer-sound",
      }),
    ).toMatchObject({ status: 404, body: { error: "Invalid ticket" } });
    expect(
      service.scan({
        code: wrongEventTicket.code,
        eventId: validTicket.eventId,
        demoUserId: "officer-sound",
      }),
    ).toMatchObject({ status: 404, body: { error: "Invalid ticket" } });
    expect(
      service.scan({
        code: refundedTicket.code,
        eventId: refundedTicket.eventId,
        demoUserId: "officer-sound",
      }),
    ).toMatchObject({ status: 404, body: { error: "Invalid ticket" } });

    expect(service.getTickets().map((ticket) => ticket.checkedInAt)).toEqual(before);
  });

  it("test_unassigned_volunteer_cannot_scan: denies other roles and volunteers assigned to another event", async () => {
    const { createCheckInService } = await import("./check-in");
    const service = createCheckInService();
    const ticket = service.getTickets()[0];

    expect(
      service.scan({
        code: ticket.code,
        eventId: ticket.eventId,
        demoUserId: "student-demo",
      }),
    ).toMatchObject({ status: 403 });
    expect(
      service.scan({
        code: ticket.code,
        eventId: ticket.eventId,
        demoUserId: "volunteer-arts",
      }),
    ).toMatchObject({ status: 403 });
    expect(service.getTickets()[0].checkedInAt).toBeNull();
  });

  it("test_offline_scan_shows_no_connection: never presents admission while offline", async () => {
    const { default: CheckInPanel } = await import("@/app/check-in-panel");
    const { cleanup, fireEvent, render, screen } = await import(
      "@testing-library/react"
    );
    const originalOnLine = Object.getOwnPropertyDescriptor(
      window.navigator,
      "onLine",
    );

    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: false,
    });

    try {
      render(<CheckInPanel />);
      fireEvent.change(screen.getByLabelText("Ticket code"), {
        target: { value: "DEMO" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Check in ticket" }));

      expect(screen.getByRole("alert")).toHaveTextContent("No connection");
      expect(screen.queryByText(/admitted|checked in/i)).not.toBeInTheDocument();
    } finally {
      cleanup();
      if (originalOnLine) {
        Object.defineProperty(window.navigator, "onLine", originalOnLine);
      } else {
        Reflect.deleteProperty(window.navigator, "onLine");
      }
    }
  });

  it("test_concurrent_scans_single_checkin: admits exactly one of two simultaneous scans", async () => {
    const { createCheckInService } = await import("./check-in");
    const service = createCheckInService();
    const ticket = service.getTickets()[0];
    const scan = () =>
      service.scan({
        code: ticket.code,
        eventId: ticket.eventId,
        demoUserId: "officer-sound",
      });

    const responses = await Promise.all([
      Promise.resolve().then(scan),
      Promise.resolve().then(scan),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    expect(service.getTickets()[0].checkedInAt).toBeTruthy();
  });

  it("test_qr_token_random_and_pii_free: generates unique opaque tokens with at least 128 bits", async () => {
    const { generateTicketToken } = await import("./check-in");
    const tokens = Array.from({ length: 100_000 }, () => generateTicketToken());

    expect(tokens.every((token) => /^[a-f0-9]{32,}$/i.test(token))).toBe(true);
    expect(new Set(tokens).size).toBe(100_000);
    expect(
      tokens.every(
        (token) => !token.includes("Alex") && !token.includes("student@andrew.cmu.edu"),
      ),
    ).toBe(true);
  });

  it("test_invalid_scan_rate_limit: pauses an account on the eleventh invalid scan in one minute", async () => {
    const { createCheckInService } = await import("./check-in");
    let now = 1_800_000_000_000;
    const service = createCheckInService({ now: () => now });

    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect(
        service.scan({
          code: `invalid-${attempt}`,
          eventId: 1,
          demoUserId: "officer-sound",
        }).status,
      ).toBe(404);
    }

    expect(
      service.scan({
        code: "eleventh-invalid",
        eventId: 1,
        demoUserId: "officer-sound",
      }),
    ).toMatchObject({ status: 429, body: { error: "Scanning paused" } });

    now += 4 * 60 * 1000;
    expect(
      service.scan({
        code: "still-paused",
        eventId: 1,
        demoUserId: "officer-sound",
      }).status,
    ).toBe(429);
    now += 60 * 1000;
    expect(
      service.scan({
        code: "pause-expired",
        eventId: 1,
        demoUserId: "officer-sound",
      }).status,
    ).toBe(404);
  });

  it("serves clearly labeled demo attendees and checks in a typed code over the API", async () => {
    const { GET, POST } = await import("@/app/api/checkin/route");
    const demoResponse = await GET();
    const demoData = await demoResponse.json();

    expect(demoResponse.status).toBe(200);
    expect(demoData.simulation).toBe(true);
    expect(demoData.tickets.length).toBeGreaterThan(0);

    const ticket = demoData.tickets[0];
    const response = await POST(
      new Request("http://localhost/api/checkin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          code: ticket.code,
          eventId: ticket.eventId,
          demoUserId: "officer-sound",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: "checked-in",
      attendeeName: ticket.attendeeName,
    });
  });
});
