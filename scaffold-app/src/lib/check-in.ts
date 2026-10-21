import { randomBytes } from "node:crypto";
import { events } from "@/lib/events";

type DemoStaff = {
  id: string;
  label: string;
  role: "club-officer" | "volunteer" | "student";
  club?: string;
  assignedEventIds: number[];
};

export type DemoTicket = {
  id: string;
  code: string;
  eventId: number;
  eventTitle: string;
  attendeeName: string;
  status: "valid" | "refunded" | "cancelled";
  checkedInAt: string | null;
};

type CheckInInput = {
  code: string;
  eventId: number;
  demoUserId: string;
};

type ScanBody = {
  status?: "checked-in" | "already-used";
  error?: string;
  message?: string;
  attendeeName?: string;
  eventTitle?: string;
  checkedInAt?: string | null;
  retryAt?: string;
};

type ScanResult = {
  status: number;
  body: ScanBody;
};

const staff: DemoStaff[] = [
  {
    id: "officer-sound",
    label: "Club officer — Scotty Sound",
    role: "club-officer",
    club: "Scotty Sound",
    assignedEventIds: events
      .filter((event) => event.club === "Scotty Sound")
      .map((event) => event.id),
  },
  {
    id: "volunteer-sound",
    label: "Assigned volunteer — Fall Fest: Afterglow",
    role: "volunteer",
    assignedEventIds: [1],
  },
  {
    id: "officer-studio",
    label: "Club officer — Studio 40",
    role: "club-officer",
    club: "Studio 40",
    assignedEventIds: events
      .filter((event) => event.club === "Studio 40")
      .map((event) => event.id),
  },
  {
    id: "volunteer-arts",
    label: "Assigned volunteer — Printmaking After Hours",
    role: "volunteer",
    assignedEventIds: [3],
  },
  {
    id: "student-demo",
    label: "Student (not check-in staff)",
    role: "student",
    assignedEventIds: [],
  },
];

export function generateTicketToken(): string {
  return randomBytes(32).toString("hex");
}

function createDemoTickets(): DemoTicket[] {
  return [
    {
      id: "demo-ticket-1",
      code: generateTicketToken(),
      eventId: 1,
      eventTitle: "Fall Fest: Afterglow",
      attendeeName: "Avery Chen",
      status: "valid",
      checkedInAt: null,
    },
    {
      id: "demo-ticket-2",
      code: generateTicketToken(),
      eventId: 2,
      eventTitle: "The Great Pumpkin Social",
      attendeeName: "Jordan Brooks",
      status: "valid",
      checkedInAt: null,
    },
    {
      id: "demo-ticket-3",
      code: generateTicketToken(),
      eventId: 1,
      eventTitle: "Fall Fest: Afterglow",
      attendeeName: "Casey Rivera",
      status: "refunded",
      checkedInAt: null,
    },
  ];
}

export function createCheckInService(options: { now?: () => number } = {}) {
  const now = options.now ?? Date.now;
  const tickets = createDemoTickets();
  const invalidScans = new Map<string, number[]>();
  const pausedUntil = new Map<string, number>();

  function getTickets(): DemoTicket[] {
    return tickets.map((ticket) => ({ ...ticket }));
  }

  function getDemoData() {
    return {
      simulation: true,
      notice:
        "Simulation only — names and selected roles are not secure authentication. Demo data is held in server memory.",
      events: events.map(({ id, title, club }) => ({ id, title, club })),
      staff: staff.map(({ id, label, role, assignedEventIds }) => ({
        id,
        label,
        role,
        assignedEventIds,
      })),
      tickets: getTickets(),
    };
  }

  function scan(input: CheckInInput): ScanResult {
    const user = staff.find((member) => member.id === input.demoUserId);
    if (!user || user.role === "student") {
      return { status: 403, body: { error: "This demo role cannot check in tickets." } };
    }

    const event = events.find((candidate) => candidate.id === input.eventId);
    const assignedToEvent =
      user.role === "club-officer"
        ? event?.club === user.club
        : user.assignedEventIds.includes(input.eventId);

    if (!assignedToEvent) {
      return { status: 403, body: { error: "This demo role is not assigned to this event." } };
    }

    const timestamp = now();
    const pauseExpiry = pausedUntil.get(user.id);
    if (pauseExpiry !== undefined && timestamp < pauseExpiry) {
      return {
        status: 429,
        body: {
          error: "Scanning paused",
          message: "Too many invalid scans. Try again in five minutes.",
          retryAt: new Date(pauseExpiry).toISOString(),
        },
      };
    }
    if (pauseExpiry !== undefined) pausedUntil.delete(user.id);

    let attempts = invalidScans.get(user.id) ?? [];
    attempts = attempts.filter((attempt) => timestamp - attempt < 60_000);
    invalidScans.set(user.id, attempts);

    const ticket = tickets.find((candidate) => candidate.code === input.code);
    if (
      !ticket ||
      ticket.eventId !== input.eventId ||
      ticket.status !== "valid"
    ) {
      attempts.push(timestamp);
      if (attempts.length > 10) {
        const blockedUntil = timestamp + 5 * 60_000;
        pausedUntil.set(user.id, blockedUntil);
        return {
          status: 429,
          body: {
            error: "Scanning paused",
            message: "Too many invalid scans. Try again in five minutes.",
            retryAt: new Date(blockedUntil).toISOString(),
          },
        };
      }
      return { status: 404, body: { error: "Invalid ticket" } };
    }

    if (ticket.checkedInAt) {
      return {
        status: 409,
        body: {
          status: "already-used",
          error: "Already used",
          message: "This ticket was already checked in.",
          attendeeName: ticket.attendeeName,
          eventTitle: ticket.eventTitle,
          checkedInAt: ticket.checkedInAt,
        },
      };
    }

    ticket.checkedInAt = new Date(timestamp).toISOString();
    return {
      status: 200,
      body: {
        status: "checked-in",
        message: "Ticket checked in.",
        attendeeName: ticket.attendeeName,
        eventTitle: ticket.eventTitle,
        checkedInAt: ticket.checkedInAt,
      },
    };
  }

  return { getTickets, getDemoData, scan };
}

let demoService: ReturnType<typeof createCheckInService> | undefined;

export function getDemoCheckInService() {
  demoService ??= createCheckInService();
  return demoService;
}
