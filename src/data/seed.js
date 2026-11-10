// Seed data: users plus 5 realistic events (dates relative to "now" so the demo always
// looks fresh), with RSVPs, tasks and comments.
import { addDays, toDateKey } from '../utils/dateHelpers';

export function buildSeed(now = new Date()) {
  const at = (days, hour, minute = 0) =>
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + days, hour, minute).toISOString();
  const due = (days) => toDateKey(addDays(now, days));
  const ago = (hours) => new Date(now.getTime() - hours * 3600000).toISOString();

  const users = [
    { id: 'u_ava', name: 'Ava Martinez', email: 'ava@example.com', avatarColor: '#6366f1' },
    { id: 'u_ben', name: 'Ben Okafor', email: 'ben@example.com', avatarColor: '#f43f5e' },
    { id: 'u_chloe', name: 'Chloe Tanaka', email: 'chloe@example.com', avatarColor: '#10b981' },
    { id: 'u_dev', name: 'Dev Patel', email: 'dev@example.com', avatarColor: '#f59e0b' },
    { id: 'u_emma', name: 'Emma Larsen', email: 'emma@example.com', avatarColor: '#0ea5e9' },
  ];
  const U = Object.fromEntries(users.map((u) => [u.id, u]));

  const events = [
    {
      id: 'evt_launch', title: 'Product Launch Party',
      description: 'Celebrate the launch of our new product line! Live music, a short demo from the product team, great food and plenty of time to mingle. Dress code: smart casual.',
      color: '#6366f1', image: '', start: at(3, 18), end: at(3, 22),
      locationType: 'in-person', location: 'The Foundry Loft, 214 Mercer St', link: '',
      capacity: 60, visibility: 'public', hostId: 'u_ava', coHostIds: ['u_ben'], createdAt: ago(240),
    },
    {
      id: 'evt_offsite', title: 'Q4 Team Offsite',
      description: 'A full day of planning, workshops and team building. Bring your laptop and your top three priorities for next quarter. Lunch and snacks provided.',
      color: '#10b981', image: '', start: at(8, 9), end: at(8, 17),
      locationType: 'in-person', location: 'Lakeside Retreat Center, Meeting Room B', link: '',
      capacity: 25, visibility: 'private', hostId: 'u_ben', coHostIds: ['u_ava'], createdAt: ago(200),
    },
    {
      id: 'evt_react', title: 'Intro to React Workshop',
      description: 'A hands-on, beginner-friendly workshop covering components, props, state and hooks. Seats are limited so everyone gets attention - join the waitlist if it fills up!',
      color: '#0ea5e9', image: '', start: at(10, 14), end: at(10, 16, 30),
      locationType: 'virtual', location: '', link: 'https://meet.example.com/react-intro',
      capacity: 6, visibility: 'public', hostId: 'u_ava', coHostIds: ['u_emma'], createdAt: ago(150),
    },
    {
      id: 'evt_dinner', title: "Chloe's Birthday Dinner",
      description: "Family-style dinner to celebrate Chloe's birthday. Please mention dietary restrictions in the comments. Surprise cake at 9pm - shhh!",
      color: '#f43f5e', image: '', start: at(14, 19), end: at(14, 22),
      locationType: 'in-person', location: 'Trattoria Bella, 18 Olive Ave', link: '',
      capacity: 12, visibility: 'private', hostId: 'u_chloe', coHostIds: ['u_dev'], createdAt: ago(100),
    },
    {
      id: 'evt_cleanup', title: 'Community Cleanup Day',
      description: 'Thanks to everyone who came out! We collected 40 bags of litter along the river trail. Gloves and bags were provided by the city.',
      color: '#f59e0b', image: '', start: at(-6, 9), end: at(-6, 12),
      locationType: 'in-person', location: 'Riverside Park, North Entrance', link: '',
      capacity: 0, visibility: 'public', hostId: 'u_dev', coHostIds: [], createdAt: ago(400),
    },
  ];

  let n = 0;
  const rsvp = (eventId, who, status, plusOnes = 0, waitlisted = false) => {
    n += 1;
    const person = typeof who === 'string' ? U[who] : who;
    return {
      id: `rsvp_${n}`, eventId, userId: typeof who === 'string' ? who : null,
      name: person.name, email: person.email, status, plusOnes, waitlisted, createdAt: ago(100 - n),
    };
  };
  const taylor = { name: 'Taylor Brooks', email: 'taylor@example.com' };
  const dana = { name: 'Dana Lee', email: 'dana@example.com' };

  const rsvps = [
    rsvp('evt_launch', 'u_ava', 'going'), rsvp('evt_launch', 'u_ben', 'going'),
    rsvp('evt_launch', 'u_chloe', 'going', 1), rsvp('evt_launch', 'u_dev', 'going'),
    rsvp('evt_launch', 'u_emma', 'maybe'), rsvp('evt_launch', taylor, 'going', 2),
    rsvp('evt_offsite', 'u_ava', 'going'), rsvp('evt_offsite', 'u_ben', 'going'),
    rsvp('evt_offsite', 'u_emma', 'going'), rsvp('evt_offsite', 'u_chloe', 'declined'),
    // React workshop: capacity 6, 5 seats taken -> a party of 2 is waitlisted
    rsvp('evt_react', 'u_ben', 'going'), rsvp('evt_react', 'u_chloe', 'going', 1),
    rsvp('evt_react', 'u_dev', 'going'), rsvp('evt_react', 'u_emma', 'going', 1),
    rsvp('evt_react', dana, 'going', 1, true),
    rsvp('evt_dinner', 'u_chloe', 'going'), rsvp('evt_dinner', 'u_dev', 'going'),
    rsvp('evt_dinner', 'u_ava', 'maybe'), rsvp('evt_dinner', 'u_ben', 'going', 1),
    rsvp('evt_cleanup', 'u_dev', 'going'), rsvp('evt_cleanup', 'u_ava', 'going', 1),
    rsvp('evt_cleanup', 'u_emma', 'going'), rsvp('evt_cleanup', 'u_chloe', 'maybe'),
  ];

  let t = 0;
  const task = (eventId, title, assigneeId, dueDays, priority, status, description = '') => {
    t += 1;
    return { id: `task_${t}`, eventId, title, description, assigneeId, dueDate: due(dueDays), priority, status, createdAt: ago(90) };
  };
  const tasks = [
    task('evt_launch', 'Book DJ and sound system', 'u_ben', 1, 'high', 'doing', 'Confirm load-in time with the venue.'),
    task('evt_launch', 'Finalize catering order', 'u_ava', -1, 'high', 'todo', 'Headcount is trending towards 60.'),
    task('evt_launch', 'Send reminder email to guests', 'u_dev', 2, 'medium', 'todo'),
    task('evt_launch', 'Print signage and name badges', 'u_emma', 0, 'low', 'done'),
    task('evt_launch', 'Set up photo booth', 'u_chloe', 3, 'medium', 'todo'),
    task('evt_offsite', 'Collect agenda items from teams', 'u_ava', -3, 'high', 'todo'),
    task('evt_offsite', 'Arrange shuttle transport', 'u_ben', 4, 'medium', 'doing'),
    task('evt_offsite', 'Order lunch and collect dietary needs', 'u_emma', 6, 'low', 'todo'),
    task('evt_react', 'Prepare slide deck', 'u_ava', 7, 'high', 'doing'),
    task('evt_react', 'Create starter repository', 'u_emma', 5, 'medium', 'todo'),
    task('evt_react', 'Test screen sharing and recording', 'u_ben', 9, 'low', 'todo'),
    task('evt_dinner', 'Order the cake', 'u_dev', 10, 'high', 'todo', 'Chocolate with raspberry, no nuts.'),
    task('evt_dinner', 'Confirm final headcount with restaurant', 'u_chloe', 12, 'medium', 'todo'),
    task('evt_cleanup', 'Collect volunteer waivers', 'u_dev', -8, 'medium', 'done'),
    task('evt_cleanup', 'Return rented equipment', 'u_ava', -4, 'medium', 'todo'),
  ];

  const comment = (id, eventId, userId, text, hours) => ({ id, eventId, userId, text, createdAt: ago(hours) });
  const comments = [
    comment('cmt_1', 'evt_launch', 'u_ben', 'DJ is confirmed - arriving at 4pm to set up. 🎧', 30),
    comment('cmt_2', 'evt_launch', 'u_dev', 'Is there parking nearby? Bringing a plus-one.', 20),
    comment('cmt_3', 'evt_launch', 'u_ava', 'Yes! Public garage on Mercer & 3rd, 2 minutes on foot.', 18),
    comment('cmt_4', 'evt_react', 'u_emma', 'Starter repo will be shared the day before. Install Node 18+.', 12),
    comment('cmt_5', 'evt_dinner', 'u_dev', "Reminder: nobody mention the cake to Chloe 🤫", 5),
  ];

  return { users, events, rsvps, tasks, comments };
}
