import EventBrowser from "./event-browser";
import { events } from "@/lib/events";

export default function Home() {
  return <EventBrowser events={events} />;
}
