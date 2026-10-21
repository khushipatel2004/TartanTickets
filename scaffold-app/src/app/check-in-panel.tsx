"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type CheckInDemoData = {
  simulation: boolean;
  notice: string;
  events: Array<{ id: number; title: string; club: string }>;
  staff: Array<{
    id: string;
    label: string;
    role: string;
    assignedEventIds: number[];
  }>;
  tickets: Array<{
    id: string;
    code: string;
    eventId: number;
    eventTitle: string;
    attendeeName: string;
    status: "valid" | "refunded" | "cancelled";
    checkedInAt: string | null;
  }>;
};

type ScanMessage = {
  kind: "success" | "error" | "info";
  text: string;
};

export default function CheckInPanel() {
  const [demoData, setDemoData] = useState<CheckInDemoData | null>(null);
  const [operatorName, setOperatorName] = useState("");
  const [demoUserId, setDemoUserId] = useState("");
  const [eventId, setEventId] = useState("");
  const [ticketCode, setTicketCode] = useState("");
  const [online, setOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine,
  );
  const [message, setMessage] = useState<ScanMessage | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadDemoData = useCallback(async () => {
    try {
      const response = await fetch("/api/checkin");
      if (!response.ok) throw new Error(`Demo data request failed: ${response.status}`);
      const data = (await response.json()) as CheckInDemoData;
      setDemoData(data);
      setDemoUserId((current) => current || data.staff[0]?.id || "");
      setEventId((current) => current || String(data.events[0]?.id ?? ""));
      setMessage(null);
    } catch {
      setMessage({
        kind: "error",
        text: "No connection. Check-in is unavailable until the server connection returns.",
      });
    }
  }, []);

  useEffect(() => {
    function updateConnection() {
      const connected = navigator.onLine;
      setOnline(connected);
      if (connected) {
        void loadDemoData();
      } else {
        setMessage({
          kind: "error",
          text: "No connection. No ticket can be admitted while offline.",
        });
      }
    }

    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    if (navigator.onLine) void loadDemoData();
    else updateConnection();

    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, [loadDemoData]);

  async function submitScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!navigator.onLine || !online) {
      setMessage({
        kind: "error",
        text: "No connection. No ticket can be admitted while offline.",
      });
      return;
    }
    if (!demoData) {
      setMessage({
        kind: "error",
        text: "Demo check-in data is not ready. Try again in a moment.",
      });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/checkin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          operatorName,
          demoUserId,
          eventId: Number(eventId),
          code: ticketCode,
        }),
      });
      const result = (await response.json()) as {
        status?: string;
        error?: string;
        message?: string;
        attendeeName?: string;
        eventTitle?: string;
        checkedInAt?: string | null;
        retryAt?: string;
      };

      if (response.ok && result.status === "checked-in") {
        setMessage({
          kind: "success",
          text: `Checked in: ${result.attendeeName} — ${result.eventTitle}.`,
        });
        setDemoData((current) =>
          current
            ? {
                ...current,
                tickets: current.tickets.map((ticket) =>
                  ticket.code === ticketCode
                    ? { ...ticket, checkedInAt: result.checkedInAt ?? null }
                    : ticket,
                ),
              }
            : current,
        );
      } else if (response.status === 409 && result.status === "already-used") {
        const scannedAt = result.checkedInAt
          ? new Date(result.checkedInAt).toLocaleString()
          : "an earlier time";
        setMessage({
          kind: "error",
          text: `Already used. This ticket was first scanned at ${scannedAt}.`,
        });
      } else {
        setMessage({
          kind: "error",
          text:
            result.error ??
            result.message ??
            "Check-in could not be completed.",
        });
      }
    } catch {
      setOnline(false);
      setMessage({
        kind: "error",
        text: "No connection. No ticket can be admitted while offline.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="checkin-page">
      <a className="checkin-back" href="/">
        ← Back to events
      </a>
      <header className="checkin-heading">
        <p className="checkin-eyebrow">TARTAN TICKETS · DOOR TOOLS</p>
        <h1>Ticket check-in</h1>
        <p>
          Enter a ticket code to check a guest in. This screen is a simulation
          and does not use secure authentication.
        </p>
      </header>

      <div className="checkin-demo-notice" role="note">
        <strong>Demo simulation</strong>
        <span>
          Names and roles are entered for demonstration only. This is not secure
          authentication; demo data lives in server memory and resets when the
          server restarts or the app is redeployed.
        </span>
      </div>

      {!online && (
        <p className="checkin-message checkin-error" role="alert">
          No connection. No ticket can be admitted while offline.
        </p>
      )}

      <section className="checkin-card" aria-labelledby="checkin-form-title">
        <div>
          <p className="checkin-eyebrow">STAFF SIMULATION</p>
          <h2 id="checkin-form-title">Verify an attendee</h2>
        </div>
        <form className="checkin-form" onSubmit={submitScan}>
          <label>
            Your name
            <input
              autoComplete="name"
              onChange={(event) => setOperatorName(event.target.value)}
              required
              value={operatorName}
            />
          </label>
          <label>
            Demo role
            <select
              onChange={(event) => setDemoUserId(event.target.value)}
              required
              value={demoUserId}
            >
              {demoData?.staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Event
            <select
              onChange={(event) => setEventId(event.target.value)}
              required
              value={eventId}
            >
              {demoData?.events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} · {event.club}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ticket code
            <input
              autoCapitalize="none"
              autoComplete="off"
              onChange={(event) => setTicketCode(event.target.value)}
              placeholder="Type or paste a ticket code"
              required
              value={ticketCode}
            />
          </label>
          <button
            className="checkin-submit"
            disabled={submitting || !online}
            type="submit"
          >
            {submitting ? "Checking…" : "Check in ticket"}
          </button>
        </form>

        {message && (
          <p
            className={`checkin-message checkin-${message.kind}`}
            role={message.kind === "error" ? "alert" : "status"}
          >
            {message.text}
          </p>
        )}
      </section>

      <section className="checkin-samples" aria-labelledby="sample-title">
        <div>
          <p className="checkin-eyebrow">IN-MEMORY SAMPLE DATA</p>
          <h2 id="sample-title">Demo tickets</h2>
          <p>Type or paste one of these codes above to try the check-in flow.</p>
        </div>
        <ul>
          {demoData?.tickets.map((ticket) => (
            <li key={ticket.id}>
              <div>
                <strong>{ticket.attendeeName}</strong>
                <span>
                  {ticket.eventTitle} ·{" "}
                  {ticket.status === "refunded"
                    ? "Refunded sample"
                    : ticket.checkedInAt
                      ? "Already checked in"
                      : "Ready to scan"}
                </span>
              </div>
              <code>{ticket.code}</code>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
