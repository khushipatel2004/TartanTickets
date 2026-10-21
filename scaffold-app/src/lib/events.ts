export type Event = {
  id: number;
  title: string;
  club: string;
  category: "Music" | "Community" | "Arts" | "Career";
  date: string;
  time: string;
  location: string;
  price: number;
  remaining: number;
  capacity: number;
  art: string;
  motif: string;
  featured?: boolean;
};

export const events: Event[] = [
  {
    id: 1,
    title: "Fall Fest: Afterglow",
    club: "Scotty Sound",
    category: "Music",
    date: "Fri, Oct 23",
    time: "8:00 PM",
    location: "Cohon University Center",
    price: 12,
    remaining: 18,
    capacity: 220,
    art: "art-sunset",
    motif: "AFTERGLOW",
    featured: true,
  },
  {
    id: 2,
    title: "The Great Pumpkin Social",
    club: "Tartan Community",
    category: "Community",
    date: "Tue, Oct 27",
    time: "6:30 PM",
    location: "The Cut",
    price: 0,
    remaining: 74,
    capacity: 100,
    art: "art-pumpkin",
    motif: "PUMPKIN\nSOCIAL",
  },
  {
    id: 3,
    title: "Printmaking After Hours",
    club: "Studio 40",
    category: "Arts",
    date: "Thu, Oct 29",
    time: "7:00 PM",
    location: "College of Fine Arts",
    price: 8,
    remaining: 0,
    capacity: 35,
    art: "art-print",
    motif: "MAKE\nYOUR MARK",
  },
  {
    id: 4,
    title: "Tartan Tech & Design Mixer",
    club: "Design Collective",
    category: "Career",
    date: "Wed, Nov 04",
    time: "5:30 PM",
    location: "Tepper Quad",
    price: 5,
    remaining: 42,
    capacity: 90,
    art: "art-mixer",
    motif: "MEET\nYOUR PEOPLE",
  },
  {
    id: 5,
    title: "Jazz in the Garden",
    club: "CMU Jazz Club",
    category: "Music",
    date: "Sat, Nov 07",
    time: "7:30 PM",
    location: "Phipps Conservatory",
    price: 15,
    remaining: 0,
    capacity: 80,
    art: "art-jazz",
    motif: "JAZZ\nIN BLOOM",
  },
  {
    id: 6,
    title: "Soup for Thought",
    club: "Food Recovery Heroes",
    category: "Community",
    date: "Tue, Nov 10",
    time: "12:00 PM",
    location: "Rangos Ballroom",
    price: 0,
    remaining: 56,
    capacity: 120,
    art: "art-soup",
    motif: "SOUP FOR\nTHOUGHT",
  },
];
