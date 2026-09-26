export const currentUser = {
  name: "Muhammad Adeel",
  role: "Advocate High Court",
  registrationNo: "LHR-12345",
  licenseNo: "LHR-HC-00765",
  bar: "Lahore High Court Bar Association",
  email: "adeel@example.com",
  phone: "+92 300 1234567",
  cnic: "35202-1234567-1",
  memberSince: "15 Aug 2020",
};

export const positions = [
  "President",
  "General Secretary",
  "Vice President",
  "Joint Secretary",
  "Finance Secretary",
];

export const candidates = [
  {
    id: 1,
    name: "Rana Shahbaz Ahmad",
    role: "Advocate High Court",
    quote: "Experience • Integrity Progress",
    photo: "/images/c1.jpg",
    position: "President",
  },
  {
    id: 2,
    name: "Asif Mahmood Khan",
    role: "Advocate Supreme Court",
    quote: "A Stronger Bar A Brighter Tomorrow",
    photo: "/images/c2.jpg",
    position: "President",
  },
  {
    id: 3,
    name: "Bilal Hassan",
    role: "Advocate High Court",
    quote: "Unity • Transparency Service",
    photo: "/images/c3.jpg",
    position: "President",
  },
];

export const elections = [
  {
    id: 1,
    month: "SEP",
    day: "15",
    year: "2025",
    title: "Election for President",
    body: "District Bar Association (2025-2026)",
    candidates: 5,
    closes: "Closes in 7 days",
    status: "ongoing",
  },
  {
    id: 2,
    month: "SEP",
    day: "15",
    year: "2025",
    title: "Election for General Secretary",
    body: "District Bar Association (2025-2026)",
    candidates: 4,
    closes: "Closes in 7 days",
    status: "ongoing",
  },
  {
    id: 3,
    month: "OCT",
    day: "05",
    year: "2025",
    title: "Election for Vice President",
    body: "District Bar Association (2025-2026)",
    candidates: 3,
    closes: "Opens in 20 days",
    status: "upcoming",
  },
  {
    id: 4,
    month: "OCT",
    day: "12",
    year: "2025",
    title: "Election for Finance Secretary",
    body: "District Bar Association (2025-2026)",
    candidates: 3,
    closes: "Opens in 27 days",
    status: "upcoming",
  },
];

export const notices = [
  {
    id: 1,
    title: "Election Schedule Announced",
    body: "The election schedule for 2025-2026 has been officially announced.",
    date: "05 Sep 2025",
    icon: "bi-calendar-event-fill",
    tone: "gold",
    important: true,
  },
  {
    id: 2,
    title: "Voter List Verification",
    body: "Please verify your details in the voter list before 10th September 2025.",
    date: "03 Sep 2025",
    icon: "bi-person-check-fill",
    tone: "blue",
    important: true,
  },
  {
    id: 3,
    title: "General Body Meeting",
    body: "General body meeting will be held on 12th September 2025.",
    date: "01 Sep 2025",
    icon: "bi-people-fill",
    tone: "gold",
    important: false,
  },
];

export const resultsByPosition = {
  President: [
    { name: "Rana Shahbaz Ahmad", votes: 212, cls: "bar-1" },
    { name: "Asif Mahmood Khan", votes: 176, cls: "bar-2" },
    { name: "Bilal Hassan", votes: 98, cls: "bar-3" },
    { name: "Naveed Akhtar", votes: 64, cls: "bar-4" },
  ],
  "General Secretary": [
    { name: "Naveed Akhtar", votes: 188, cls: "bar-1" },
    { name: "Rana Shahbaz Ahmad", votes: 151, cls: "bar-2" },
  ],
};

export const dashboardStats = [
  { label: "Active Elections", value: "2", icon: "bi-briefcase-fill", tone: "gold" },
  { label: "Total Candidates", value: "12", icon: "bi-people-fill", tone: "blue" },
  { label: "Notices", value: "2", icon: "bi-file-earmark-text-fill", tone: "blue" },
];
