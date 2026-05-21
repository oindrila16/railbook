/**
 * RailBook support knowledge base for the live chatbot.
 */
const APP_NAME = process.env.APP_NAME || 'RailBook';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@trainbooking.com';

const FAQ_ENTRIES = [
  {
    id: 'booking',
    keywords: ['booking', 'reserve', 'buy ticket', 'purchase', 'how to book', 'make a booking'],
    answer: `To book a ticket: open **Search** on the home page, choose **From** and **To** stations, pick your travel date and class, then select a train and tap **Book now**. Sign in if prompted, add passenger details, and confirm payment.`,
    suggestions: ['Search trains', 'Fare classes', 'Cancel a booking'],
  },
  {
    id: 'search',
    keywords: ['search', 'find train', 'route', 'station', 'schedule', 'trains between'],
    answer: `Use the **Search** tab on the home page or go to **Trains** in the menu. Enter station codes (e.g. DHK → CTG), date, passengers, and class. You can also open **Offers** or **Prices** to browse popular routes and fares.`,
    suggestions: ['How to book', 'Check prices', 'Seat availability'],
  },
  {
    id: 'pnr',
    keywords: ['pnr', 'reference', 'booking reference', 'confirmation', 'booking id', 'status'],
    answer: `Your **PNR** is the booking reference shown after checkout and in **My Bookings**. On the home page, open the **PNR** tab, enter the reference, and view status, route, date, and fare class.`,
    suggestions: ['My bookings', 'Cancel booking', 'Contact support'],
  },
  {
    id: 'cancel',
    keywords: [
      'cancel',
      'cancellation',
      'cancel booking',
      'cancel a booking',
      'refund',
      'change booking',
      'modify booking',
    ],
    answer: `Confirmed bookings can be cancelled from **My Bookings** — open your trip and use **Cancel booking**. Seats are released and others on the waitlist may be promoted. Refund rules depend on how close you are to departure.`,
    suggestions: ['Waitlist', 'My bookings', 'Contact support'],
  },
  {
    id: 'waitlist',
    keywords: ['waitlist', 'wait list', 'full', 'no seats', 'sold out'],
    answer: `If a train is full, you can **join the waitlist** at checkout. When a seat is freed (e.g. cancellation), the next person may be promoted automatically and notified by email.`,
    suggestions: ['How to book', 'Cancel booking', 'Seat availability'],
  },
  {
    id: 'otp',
    keywords: ['otp', 'verify', 'verification', 'email code', '6 digit', 'account verify'],
    answer: `After registering, enter the **6-digit OTP** sent to your email. In local development with email mock enabled, check the **backend terminal** for \`[EMAIL MOCK]\` output if you did not receive an email.`,
    suggestions: ['Login help', 'Create account', 'Contact support'],
  },
  {
    id: 'account',
    keywords: ['account', 'register', 'sign up', 'login', 'log in', 'password', 'profile'],
    answer: `Tap **Sign up** to create an account, verify with OTP, then **Log in** to book and view **My Bookings**. Your session stays active for several days on this device.`,
    suggestions: ['OTP verification', 'How to book', 'Reset — contact support'],
  },
  {
    id: 'pricing',
    keywords: ['price', 'prices', 'fare', 'fares', 'cost', 'bdt', 'taka', 'expensive', 'cheap', 'class'],
    answer: `Fares are in **Bangladeshi Taka (৳)** and vary by route, class (**Economy**, **Business**, **First Class**), and date. Prices update dynamically — see **Prices** for the full matrix or **Offers** for popular routes.`,
    suggestions: ['Search trains', 'Fare classes', 'Top routes'],
  },
  {
    id: 'seats',
    keywords: ['seat', 'seats', 'availability', 'available', 'left', 'vacant', 'berth'],
    answer: `Check **Seat Availability** on the home page: pick route, date, and class to see seats left per train. Search results also show live seat counts when the server is connected.`,
    suggestions: ['Search trains', 'Waitlist', 'Live status'],
  },
  {
    id: 'live',
    keywords: ['live', 'tracking', 'where is train', 'delay', 'running', 'status train'],
    answer: `Open the **Live** tab on the home page, choose a train number and date to see simulated running status, delays, and progress along the route.`,
    suggestions: ['Search trains', 'PNR status', 'Help page'],
  },
  {
    id: 'payment',
    keywords: ['payment', 'pay', 'paid', 'total', 'amount', 'receipt'],
    answer: `The total fare is shown before you confirm booking, based on route, class, passenger count, and dynamic pricing. After booking, the amount appears on your ticket and in **My Bookings**.`,
    suggestions: ['How to book', 'Prices', 'PNR status'],
  },
  {
    id: 'support',
    keywords: ['contact', 'support', 'help', 'email', 'human', 'agent', 'talk to someone'],
    answer: `I can answer common questions about booking, PNR, cancellations, and fares. For account-specific issues, email **${SUPPORT_EMAIL}** or visit the **Help** page. Our team typically replies within one business day.`,
    suggestions: ['Help page', 'How to book', 'PNR status'],
  },
];

const GREETING_PATTERNS =
  /^(hi|hello|hey|yo|good morning|good afternoon|good evening|salam|assalam|namaste)\b/i;
const THANKS_PATTERNS =
  /^(thanks|thank you|thx|ty|shukriya|dhonnobad)\b|(\bthanks\b|\bthank you\b).*(\b(bye|goodbye)\b)/i;
const BYE_PATTERNS =
  /\b(bye|goodbye|see you|see ya|gotta go|farewell|take care|talk later|catch you later|good night|goodnight)\b|^(ok|okay|alright|sure)[,.\s!]*(bye|goodbye|good night)\s*$/i;
const ACK_PATTERNS =
  /^(ok|okay|alright|sure|got it|understood|cool|nice|fine|great|perfect)\s*[!.]?$/i;
const SMALL_TALK_PATTERNS =
  /\b(how are you|how r u|hows it going|how is it going|how you doing|how have you been|how do you do|whats up|what s up|you ok|are you ok|are you there|hows everything|everything ok)\b/i;
const WHO_ARE_YOU_PATTERNS =
  /\b(who are you|what are you|your name|who is this|are you a bot|are you real)\b/i;
const CAPABILITIES_PATTERNS =
  /\b(what can you do|what do you do|how can you help|what do you know)\b/i;

const QUICK_LINKS = {
  'Search trains': '/search',
  'How to book': null,
  'My bookings': '/bookings',
  'Help page': '/help',
  'Check prices': '/prices',
  'Top routes': '/offers',
  'PNR status': null,
  'Create account': '/register',
  'Login help': '/login',
  'Cancel a booking': null,
  'Cancel booking': null,
  'What can you do?': null,
};

function getWelcomeMessage() {
  return {
    reply: `Hello! I'm the **${APP_NAME}** assistant. Ask me about booking trains, PNR status, fares in ৳, cancellations, waitlist, or seat availability.`,
    suggestions: ['How do I book?', 'Check PNR status', 'Fare prices', 'Cancel a booking'],
    meta: { intent: 'welcome' },
  };
}

module.exports = {
  APP_NAME,
  SUPPORT_EMAIL,
  FAQ_ENTRIES,
  GREETING_PATTERNS,
  THANKS_PATTERNS,
  BYE_PATTERNS,
  ACK_PATTERNS,
  SMALL_TALK_PATTERNS,
  WHO_ARE_YOU_PATTERNS,
  CAPABILITIES_PATTERNS,
  QUICK_LINKS,
  getWelcomeMessage,
};
