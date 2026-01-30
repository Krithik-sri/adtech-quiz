import { Question } from './types';

export const quizQuestions: Question[] = [
  {
    id: 1,
    category: "Basics",
    question: "What is the key difference between an 'Ad Slot' and 'Ad Space'?",
    options: [
      "They are exactly the same thing.",
      "Ad Slot is the container on the site; Ad Space is the actual impression inside it.",
      "Ad Space is the HTML code; Ad Slot is the server.",
      "Ad Slot is for video; Ad Space is for banners."
    ],
    correctAnswer: 1,
    explanation: "Think of a billboard: The structure itself is the Ad Slot, while the white area where the paper is pasted is the Ad Space."
  },
  {
    id: 2,
    category: "Technology",
    question: "Which platform allows publishers to manage, sell, and optimize their ad inventory?",
    options: [
      "Demand-Side Platform (DSP)",
      "Data Management Platform (DMP)",
      "Supply-Side Platform (SSP)",
      "Creative Optimization Platform (DCO)"
    ],
    correctAnswer: 2,
    explanation: "An SSP helps publishers monetize assets by connecting to ad exchanges and DSPs."
  },
  {
    id: 3,
    category: "Media Buying",
    question: "In a Second-Price Auction (Vickrey Auction), what does the winner pay?",
    options: [
      "Exactly what they bid.",
      "The average of all bids.",
      "$0.01 more than the second-highest bid.",
      "The floor price set by the publisher."
    ],
    correctAnswer: 2,
    explanation: "The winner pays the 'clearing price', which is typically just above the runner-up bid, encouraging truthful bidding."
  },
  {
    id: 4,
    category: "Tracking",
    question: "What is 'Piggybacking' in the context of ad tracking?",
    options: [
      "Stealing another advertiser's data.",
      "Embedding third-party tracking pixels inside a master pixel/ad markup.",
      "Using a competitor's creative assets.",
      "Running two ads in the same slot simultaneously."
    ],
    correctAnswer: 1,
    explanation: "Piggybacking allows external platforms (like verification tools) to log impressions simultaneously with the primary ad server."
  },
  {
    id: 5,
    category: "Media Buying",
    question: "What problem was Header Bidding designed to solve?",
    options: [
      "The lack of video ad support.",
      "The inefficiency and sequential nature of 'Waterfalling'.",
      "High costs of DSPs.",
      "The decline of third-party cookies."
    ],
    correctAnswer: 1,
    explanation: "Header bidding allows all demand sources to bid simultaneously, rather than sequentially, increasing yield for publishers."
  },
  {
    id: 6,
    category: "Attribution",
    question: "Which attribution model assigns 100% of the credit to the final interaction before conversion?",
    options: [
      "Linear Model",
      "Time Decay Model",
      "First Click Model",
      "Last Click Model"
    ],
    correctAnswer: 3,
    explanation: "Last Click attribution ignores earlier touchpoints and credits the final referrer, which is simple but often incomplete."
  },
  {
    id: 7,
    category: "User ID",
    question: "What is 'Deterministic Matching' in cross-device tracking?",
    options: [
      "Using algorithms to guess it's the same user.",
      "Using common identifiers like email addresses to link devices with high accuracy.",
      "Matching users based on IP address and browser font.",
      "Tracking users via GPS location only."
    ],
    correctAnswer: 1,
    explanation: "Deterministic matching relies on login data (like email) to link a phone and laptop to the same person with 80-90% accuracy."
  },
  {
    id: 8,
    category: "Targeting",
    question: "Contextual Targeting does NOT rely on which of the following?",
    options: [
      "Keywords on the page.",
      "User's past browsing history and cookies.",
      "The specific URL or domain.",
      "The topic of the article."
    ],
    correctAnswer: 1,
    explanation: "Contextual targeting matches ads to the content being consumed right now, not who the user is or what they did before."
  },
  {
    id: 9,
    category: "Technology",
    question: "What is the primary function of a Data Management Platform (DMP)?",
    options: [
      "To serve the ad creative to the user.",
      "To negotiate prices between DSP and SSP.",
      "To collect, normalize, and segment audience data.",
      "To detect fraud in real-time."
    ],
    correctAnswer: 2,
    explanation: "DMPs ingest data from various sources to build audience segments for targeting."
  },
  {
    id: 10,
    category: "Basics",
    question: "Which metric is best for branding campaigns to measure how many people saw an ad?",
    options: [
      "CPA (Cost Per Action)",
      "CPC (Cost Per Click)",
      "Viewable Impressions",
      "Conversion Rate"
    ],
    correctAnswer: 2,
    explanation: "For branding, knowing that a real human actually saw the ad (Viewable Impression) is more critical than direct clicks."
  },
  {
    id: 11,
    category: "Buying",
    question: "What does 'Programmatic Direct' typically involve?",
    options: [
      "Real-time bidding on an open exchange.",
      "Guaranteed ad inventory sold directly between buyer and seller via automation.",
      "Buying ads manually through email insertion orders.",
      "Targeting users randomly across the web."
    ],
    correctAnswer: 1,
    explanation: "Programmatic Direct automates the direct buying process, offering guaranteed inventory without an auction."
  },
  {
    id: 12,
    category: "Metrics",
    question: "What does 'eCPM' stand for?",
    options: [
      "Effective Cost Per Mille",
      "Estimated Cost Per Million",
      "Electronic Cost Per Minute",
      "Efficient Clicks Per Month"
    ],
    correctAnswer: 0,
    explanation: "eCPM (Effective Cost Per Mille) measures the revenue generated per 1,000 impressions, regardless of the buying model (CPC, CPA, etc.)."
  },
  {
    id: 13,
    category: "Privacy",
    question: "What is the main purpose of 'ads.txt'?",
    options: [
      "To improve ad creative load times.",
      "To prevent unauthorized selling of a publisher's inventory (Domain Spoofing).",
      "To store user cookies securely.",
      "To text users advertisements."
    ],
    correctAnswer: 1,
    explanation: "ads.txt (Authorized Digital Sellers) is a file publishers host to list who is authorized to sell their inventory, fighting fraud."
  },
  {
    id: 14,
    category: "Tech",
    question: "What is a 'Vast Tag' (VAST) used for?",
    options: [
      "Tracking banner clicks.",
      "Serving video ads and communicating between video players and ad servers.",
      "Optimizing SEO keywords.",
      "Validating email addresses."
    ],
    correctAnswer: 1,
    explanation: "VAST (Video Ad Serving Template) is a standard script that tells video players which video ad to play and how to track it."
  },
  {
    id: 15,
    category: "Basics",
    question: "What is 'frequency capping'?",
    options: [
      "Limiting the number of times a specific user sees an ad.",
      "Capping the maximum bid price in an auction.",
      "Limiting the speed of the website loading.",
      "Restricting the number of ads on a single page."
    ],
    correctAnswer: 0,
    explanation: "Frequency capping ensures a user isn't annoyed by seeing the same ad too many times, improving user experience and ROI."
  },
  {
    id: 16,
    category: "Metrics",
    question: "What is the IAB/MRC standard for a 'Viewable' display impression?",
    options: [
      "50% of pixels in view for 1 continuous second",
      "100% of pixels in view for 1 second",
      "50% of pixels in view for 2 continuous seconds",
      "Any part of the ad is visible"
    ],
    correctAnswer: 0,
    explanation: "The industry standard (MRC) states a display ad is viewable if 50% of its pixels are in view for at least 1 continuous second."
  },
  {
    id: 17,
    category: "Privacy",
    question: "Which regulation primarily protects the data privacy of EU citizens?",
    options: [
      "CCPA",
      "GDPR",
      "COPPA",
      "HIPAA"
    ],
    correctAnswer: 1,
    explanation: "GDPR (General Data Protection Regulation) is the comprehensive data privacy law protecting individuals in the European Union."
  },
  {
    id: 18,
    category: "Data",
    question: "What is 'First-Party Data'?",
    options: [
      "Data purchased from a data broker.",
      "Data collected directly from your own customers/audience.",
      "Data shared between two non-competing companies.",
      "Anonymized data from an ad exchange."
    ],
    correctAnswer: 1,
    explanation: "First-party data is information you collect directly from your audience (e.g., website visitors, CRM), making it highly valuable and accurate."
  },
  {
    id: 19,
    category: "Buying",
    question: "In a Private Marketplace (PMP), who is allowed to bid?",
    options: [
      "Anyone with a DSP.",
      "Only invited buyers via a Deal ID.",
      "Only the publisher's internal team.",
      "Search engines only."
    ],
    correctAnswer: 1,
    explanation: "PMPs are invitation-only auctions where publishers invite specific buyers to bid on high-quality inventory using a unique Deal ID."
  },
  {
    id: 20,
    category: "Tech",
    question: "What does 'SPO' stand for in AdTech?",
    options: [
      "Supply Path Optimization",
      "Static Page Optimization",
      "Server Pacing Option",
      "Standard Protocol Output"
    ],
    correctAnswer: 0,
    explanation: "SPO helps buyers find the most efficient and cost-effective route to access inventory, cutting out unnecessary intermediaries."
  },
  {
    id: 21,
    category: "Industry",
    question: "Which companies are commonly referred to as 'Walled Gardens'?",
    options: [
      "The Open Web (CNN, NYT, etc.)",
      "Google, Facebook (Meta), Amazon",
      "SSPs like Magnite and PubMatic",
      "Ad Networks"
    ],
    correctAnswer: 1,
    explanation: "Walled Gardens like Google and Meta have closed ecosystems where they control the tech, the data, and the media, making independent verification harder."
  },
  {
    id: 22,
    category: "Targeting",
    question: "What is a 'Lookalike Audience'?",
    options: [
      "Users who look physically similar to models in ads.",
      "A group of users who share similar characteristics/behaviors to your existing customers.",
      "People who have visited your site before.",
      "Bots that mimic human behavior."
    ],
    correctAnswer: 1,
    explanation: "Lookalike modeling uses seed data (like your best customers) to find new people who behave similarly, expanding reach effectively."
  },
  {
    id: 23,
    category: "Metrics",
    question: "If you spent $500 and got 50 clicks, what is your CPC?",
    options: [
      "$0.10",
      "$10.00",
      "$5.00",
      "$2.50"
    ],
    correctAnswer: 1,
    explanation: "CPC = Total Cost / Total Clicks. $500 / 50 = $10.00."
  },
  {
    id: 24,
    category: "Tech",
    question: "What is the difference between client-side and server-side header bidding?",
    options: [
      "Client-side runs in the browser; server-side runs on a remote server.",
      "Client-side is faster.",
      "Server-side uses cookies; client-side does not.",
      "There is no difference."
    ],
    correctAnswer: 0,
    explanation: "Client-side happens in the user's browser (can slow page load), while server-side moves the auction to the cloud (faster but less cookie matching)."
  },
  {
    id: 25,
    category: "Fraud",
    question: "What is 'Domain Spoofing'?",
    options: [
      "Hacking a website's homepage.",
      "Falsely representing low-quality inventory as a premium site (e.g., NYTimes.com) to trick buyers.",
      "Stealing a domain name.",
      "Blocking ads on a domain."
    ],
    correctAnswer: 1,
    explanation: "Fraudsters trick buyers into thinking they are buying premium slots (like NYTimes.com) when the ad actually runs on a low-quality site."
  },
  {
    id: 26,
    category: "Creative",
    question: "What defines 'Native Advertising'?",
    options: [
      "Ads that pop up in a new window.",
      "Ads that match the look, feel, and function of the media format in which they appear.",
      "Video ads that autoplay.",
      "Ads targeted to native speakers."
    ],
    correctAnswer: 1,
    explanation: "Native ads blend in with the surrounding content (like a 'Sponsored' article in a news feed), often leading to higher engagement."
  },
  {
    id: 27,
    category: "Attribution",
    question: "What is 'Multi-Touch Attribution' (MTA)?",
    options: [
      "Giving credit to every click equally.",
      "Assigning fractional credit to multiple touchpoints along the customer journey.",
      "Tracking users across multiple screens.",
      "Using multiple fingers to click an ad."
    ],
    correctAnswer: 1,
    explanation: "MTA acknowledges that a user might see a banner, click a search ad, and then convert, assigning value to each step rather than just the last one."
  },
  {
    id: 28,
    category: "Buying",
    question: "What is a 'Deal ID'?",
    options: [
      "A discount code for advertisers.",
      "A unique identifier representing a pre-negotiated agreement between a buyer and seller.",
      "The login password for a DSP.",
      "The ID of a specific creative."
    ],
    correctAnswer: 1,
    explanation: "A Deal ID is a string of characters attached to a bid request that signals a special arrangement (like a PMP or Preferred Deal) to the buyer."
  },
  {
    id: 29,
    category: "Metrics",
    question: "What does 'CTR' calculate?",
    options: [
      "Conversions per Impression.",
      "Cost per Transaction.",
      "The percentage of impressions that resulted in a click.",
      "Clicks to Revenue ratio."
    ],
    correctAnswer: 2,
    explanation: "CTR (Click-Through Rate) = (Clicks / Impressions) * 100. It measures how often people who see your ad end up clicking it."
  },
  {
    id: 30,
    category: "Basics",
    question: "Who typically pays the 'Ad Tech Tax'?",
    options: [
      "The user.",
      "The government.",
      "The advertiser and publisher (via intermediaries taking a cut).",
      "The internet service provider."
    ],
    correctAnswer: 2,
    explanation: "The 'tax' refers to the percentage of the advertiser's dollar that goes to tech middlemen (DSPs, SSPs, exchanges) rather than the publisher."
  }
];