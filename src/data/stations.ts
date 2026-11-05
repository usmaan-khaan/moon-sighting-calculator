export interface ObserverStation {
  id: string;
  name: string;
  shortName: string;
  country: string;
  region: "Middle East" | "Asia" | "Europe" | "Americas" | "Africa" | "Oceania";
  icon: string;
  latitude: number;
  longitude: number;
  elevation: number; // in meters
  observatory?: string;
  description?: string;
  isCustom?: boolean;
}

export function isObserverStation(value: unknown): value is ObserverStation {
  if (!value || typeof value !== 'object') return false;
  const station = value as ObserverStation;
  return ['id', 'name', 'shortName', 'country', 'icon'].every(key => typeof station[key] === 'string')
    && ['Middle East', 'Asia', 'Europe', 'Americas', 'Africa', 'Oceania'].includes(station.region)
    && Number.isFinite(station.latitude) && Math.abs(station.latitude) <= 90
    && Number.isFinite(station.longitude) && Math.abs(station.longitude) <= 180
    && Number.isFinite(station.elevation) && station.elevation >= -500 && station.elevation <= 9000
    && (station.observatory === undefined || typeof station.observatory === 'string')
    && (station.description === undefined || typeof station.description === 'string')
    && (station.isCustom === undefined || typeof station.isCustom === 'boolean');
}

export const COMMON_STATIONS: ObserverStation[] = [
  // Middle East & Holy Sanctuaries
  {
    id: "mecca",
    name: "Mecca (Holy Kaaba & Clock Royal Tower)",
    shortName: "Mecca",
    country: "Saudi Arabia",
    region: "Middle East",
    icon: "🕋",
    latitude: 21.4225,
    longitude: 39.8262,
    elevation: 277,
    observatory: "Makkah Clock Royal Astronomical Center",
    description: "Primary Islamic reference meridian for the worldwide Ummah and Umm al-Qura calendar."
  },
  {
    id: "medina",
    name: "Medina (Al-Masjid an-Nabawi)",
    shortName: "Medina",
    country: "Saudi Arabia",
    region: "Middle East",
    icon: "🕌",
    latitude: 24.4672,
    longitude: 39.6111,
    elevation: 608,
    observatory: "Medina Regional Astronomical Station",
    description: "Key sighting region in western Saudi Arabia, elevated 608m above sea level with clear desert horizons."
  },
  {
    id: "jerusalem",
    name: "Jerusalem (Al-Quds / Old City)",
    shortName: "Jerusalem",
    country: "Palestine",
    region: "Middle East",
    icon: "✨",
    latitude: 31.7767,
    longitude: 35.2345,
    elevation: 754,
    observatory: "Jabal az-Zaytoun Observational Post",
    description: "High elevation ridge offering expansive horizons westward over the Mediterranean coastal plain."
  },
  {
    id: "cairo",
    name: "Cairo (Helwan Astronomical Observatory)",
    shortName: "Cairo",
    country: "Egypt",
    region: "Middle East",
    icon: "🏺",
    latitude: 29.8608,
    longitude: 31.3439,
    elevation: 114,
    observatory: "National Research Institute of Astronomy and Geophysics (NRIAG)",
    description: "Historic observatory established in 1903, central to Egyptian Dar al-Ifta crescent sighting committees."
  },
  {
    id: "riyadh",
    name: "Riyadh (KACST Astronomical Observatory)",
    shortName: "Riyadh",
    country: "Saudi Arabia",
    region: "Middle East",
    icon: "🏙️",
    latitude: 24.7136,
    longitude: 46.6753,
    elevation: 612,
    observatory: "King Abdulaziz City for Science & Technology (KACST)",
    description: "Hosts automated CCD hilal camera systems and satellite optical telemetry."
  },
  {
    id: "dubai",
    name: "Dubai (Al Thuraya Astronomy Centre)",
    shortName: "Dubai",
    country: "United Arab Emirates",
    region: "Middle East",
    icon: "🔭",
    latitude: 25.2157,
    longitude: 55.4382,
    elevation: 18,
    observatory: "Al Thuraya Astronomy Centre Mushrif Park",
    description: "Modern Emirati observatory equipped with high-aperture solar and lunar tracking telescopes."
  },
  {
    id: "amman",
    name: "Amman (Jordanian Astronomical Society)",
    shortName: "Amman",
    country: "Jordan",
    region: "Middle East",
    icon: "🏛️",
    latitude: 31.9566,
    longitude: 35.9457,
    elevation: 850,
    observatory: "Jabal al-Qal'a & Maragha Observatory",
    description: "Founder base of the International Crescent Observation Project (ICOP) led by Mohammad Odeh."
  },
  {
    id: "istanbul",
    name: "Istanbul (Kandilli Astronomical Observatory)",
    shortName: "Istanbul",
    country: "Turkey",
    region: "Middle East",
    icon: "🌉",
    latitude: 41.0631,
    longitude: 29.0628,
    elevation: 130,
    observatory: "Boğaziçi University Kandilli Observatory",
    description: "Renowned observatory overlooking the Bosphorus, official source for the Diyanet Turkish calendar."
  },
  {
    id: "tehran",
    name: "Tehran (Institute of Geophysics)",
    shortName: "Tehran",
    country: "Iran",
    region: "Middle East",
    icon: "🏔️",
    latitude: 35.7397,
    longitude: 51.3882,
    elevation: 1430,
    observatory: "University of Tehran Moonsighting Headquarters",
    description: "High plateau station (1,430m) with exceptional thin air clarity, coordinating 150+ observation teams."
  },
  {
    id: "casablanca",
    name: "Casablanca & Rabat (Moroccan Sighting Network)",
    shortName: "Casablanca",
    country: "Morocco",
    region: "Middle East",
    icon: "🌊",
    latitude: 33.5731,
    longitude: -7.5898,
    elevation: 35,
    observatory: "Ministry of Habous and Islamic Affairs Moonsighting Grid",
    description: "Morocco operates the most rigorous nationwide network of 200+ trained military and civilian observers."
  },
  {
    id: "muscat",
    name: "Muscat (Oman Astronomical Society)",
    shortName: "Muscat",
    country: "Oman",
    region: "Middle East",
    icon: "🇴🇲",
    latitude: 23.5880,
    longitude: 58.3829,
    elevation: 25,
    observatory: "Oman Astronomical Society & Jabal Akhdar Station",
    description: "Utilizes high-altitude observation posts in Jabal Shams (3,000m) for crescent tracking."
  },

  // Asia & Pacific
  {
    id: "karachi",
    name: "Karachi (Central Ruet-e-Hilal & Suparco)",
    shortName: "Karachi",
    country: "Pakistan",
    region: "Asia",
    icon: "🌙",
    latitude: 24.8607,
    longitude: 67.0011,
    elevation: 30,
    observatory: "Pakistan Space & Upper Atmosphere Research Commission (SUPARCO)",
    description: "Official convening station for Pakistan's Central Ruet-e-Hilal Committee and marine horizon sighting."
  },
  {
    id: "lahore",
    name: "Lahore (Punjab University Astronomical Observatory)",
    shortName: "Lahore",
    country: "Pakistan",
    region: "Asia",
    icon: "🕌",
    latitude: 31.5204,
    longitude: 74.3587,
    elevation: 217,
    observatory: "Punjab University Historical Observatory (Founded 1932)",
    description: "Historic Punjab sighting center coordinating moon observations for eastern Pakistan."
  },
  {
    id: "islamabad",
    name: "Islamabad (Margalla Sighting Post & Ruet-e-Hilal)",
    shortName: "Islamabad",
    country: "Pakistan",
    region: "Asia",
    icon: "🏔️",
    latitude: 33.6844,
    longitude: 73.0479,
    elevation: 540,
    observatory: "Margalla Hills Astronomical Vantage & Ministry of Religious Affairs",
    description: "Headquarters station for the central Ruet-e-Hilal announcement committee."
  },
  {
    id: "jakarta",
    name: "Jakarta & Lembang (Bosscha Observatory)",
    shortName: "Jakarta",
    country: "Indonesia",
    region: "Asia",
    icon: "🌴",
    latitude: -6.8247,
    longitude: 107.6158,
    elevation: 1310,
    observatory: "Bosscha Observatory (Institut Teknologi Bandung)",
    description: "Oldest modern observatory in Indonesia; key station for the MABIMS regional sighting criterion."
  },
  {
    id: "kuala-lumpur",
    name: "Kuala Lumpur (Teluk Kemang Observatory)",
    shortName: "Kuala Lumpur",
    country: "Malaysia",
    region: "Asia",
    icon: "🏙️",
    latitude: 2.4518,
    longitude: 101.8542,
    elevation: 45,
    observatory: "Kompleks Baitul Hilal Teluk Kemang, Port Dickson",
    description: "Premier coastal moon-sighting station in Malaysia with panoramic Malacca Strait sunset views."
  },
  {
    id: "new-delhi",
    name: "New Delhi (Delhi Astronomy Hub)",
    shortName: "New Delhi",
    country: "India",
    region: "Asia",
    icon: "🕌",
    latitude: 28.6139,
    longitude: 77.2090,
    elevation: 216,
    observatory: "Jantar Mantar & Nehru Planetarium",
    description: "Historic astronomical observation station in northern India."
  },
  {
    id: "dhaka",
    name: "Dhaka (National Moonsighting Committee)",
    shortName: "Dhaka",
    country: "Bangladesh",
    region: "Asia",
    icon: "🌾",
    latitude: 23.8103,
    longitude: 90.4125,
    elevation: 23,
    observatory: "Islamic Foundation Bangladesh, Baitul Mukarram",
    description: "National observation coordinating center for Bangladesh divisions."
  },
  {
    id: "singapore",
    name: "Singapore (Science Centre Observatory)",
    shortName: "Singapore",
    country: "Singapore",
    region: "Asia",
    icon: "🇸🇬",
    latitude: 1.3329,
    longitude: 103.7360,
    elevation: 22,
    observatory: "Omni-Theatre & Science Centre Observatory",
    description: "Equatorial observation station (1.3° N) with near-vertical celestial sphere trajectories."
  },
  {
    id: "tashkent",
    name: "Tashkent (Ulugh Beg Astronomical Institute)",
    shortName: "Tashkent",
    country: "Uzbekistan",
    region: "Asia",
    icon: "🏛️",
    latitude: 41.3283,
    longitude: 69.2974,
    elevation: 480,
    observatory: "Ulugh Beg Astronomical Institute of the Uzbek Academy of Sciences",
    description: "Continuator of the legendary 15th-century Samarkand observatory built by Ulugh Beg."
  },
  {
    id: "tokyo",
    name: "Tokyo (Mitaka National Observatory)",
    shortName: "Tokyo",
    country: "Japan",
    region: "Asia",
    icon: "🏯",
    latitude: 35.6762,
    longitude: 139.6503,
    elevation: 58,
    observatory: "National Astronomical Observatory of Japan (NAOJ)",
    description: "Prime astronomical hub in East Asia."
  },

  // Europe
  {
    id: "london",
    name: "London (Royal Observatory Greenwich)",
    shortName: "London",
    country: "United Kingdom",
    region: "Europe",
    icon: "🏛️",
    latitude: 51.4778,
    longitude: -0.0015,
    elevation: 68,
    observatory: "Royal Observatory Greenwich (Prime Meridian)",
    description: "Birthplace of Greenwich Mean Time (GMT) and the global 0° longitude reference."
  },
  {
    id: "paris",
    name: "Paris (Paris Observatory - PSL)",
    shortName: "Paris",
    country: "France",
    region: "Europe",
    icon: "🗼",
    latitude: 48.8354,
    longitude: 2.3364,
    elevation: 60,
    observatory: "Observatoire de Paris (Founded 1667)",
    description: "One of the oldest astronomical research centers in the Western world."
  },
  {
    id: "madrid",
    name: "Madrid (Royal Astronomical Observatory)",
    shortName: "Madrid",
    country: "Spain",
    region: "Europe",
    icon: "🇪🇸",
    latitude: 40.4089,
    longitude: -3.6883,
    elevation: 660,
    observatory: "Real Observatorio de Madrid",
    description: "Elevated European capital station (660m) providing high visibility over central Iberia."
  },
  {
    id: "frankfurt",
    name: "Frankfurt (Taunus Astronomical Station)",
    shortName: "Frankfurt",
    country: "Germany",
    region: "Europe",
    icon: "🏰",
    latitude: 50.1109,
    longitude: 8.6821,
    elevation: 112,
    observatory: "Physikalischer Verein Frankfurt",
    description: "Central European observation point for German crescent monitoring networks."
  },
  {
    id: "sarajevo",
    name: "Sarajevo (Trebević Mountain Observatory)",
    shortName: "Sarajevo",
    country: "Bosnia and Herzegovina",
    region: "Europe",
    icon: "🌄",
    latitude: 43.8563,
    longitude: 18.4131,
    elevation: 540,
    observatory: "Astronomical Observatory Čolina Kapa",
    description: "Balkan center of Islamic astronomical tradition and calendar calculations."
  },

  // Americas
  {
    id: "new-york",
    name: "New York (Columbia Astronomical Station)",
    shortName: "New York",
    country: "United States",
    region: "Americas",
    icon: "🗽",
    latitude: 40.7829,
    longitude: -73.9654,
    elevation: 40,
    observatory: "Central Park & Columbia Pupin Observatory",
    description: "East Coast observation station for North American Islamic sighting councils."
  },
  {
    id: "los-angeles",
    name: "Los Angeles (Griffith Observatory)",
    shortName: "Los Angeles",
    country: "United States",
    region: "Americas",
    icon: "🌴",
    latitude: 34.1184,
    longitude: -118.3004,
    elevation: 346,
    observatory: "Griffith Observatory, Mount Hollywood",
    description: "Iconic mountain-perched observatory with unobstructed western Pacific sunset horizons."
  },
  {
    id: "dallas",
    name: "Dallas (Texas Astronomical Society & DFW Watch)",
    shortName: "Dallas",
    country: "United States",
    region: "Americas",
    icon: "🤠",
    latitude: 32.7767,
    longitude: -96.7970,
    elevation: 131,
    observatory: "Texas Astronomical Society & DFW Regional Hilal Post",
    description: "Major North Texas observational post with flat prairie sunset horizon lines."
  },
  {
    id: "houston",
    name: "Houston (George Observatory & Gulf Coast)",
    shortName: "Houston",
    country: "United States",
    region: "Americas",
    icon: "🚀",
    latitude: 29.7604,
    longitude: -95.3698,
    elevation: 15,
    observatory: "George Observatory (Brazos Bend) & Greater Houston Hilal Committee",
    description: "Equipped with large research telescopes and Gulf Coast low-aerosol sighting vantage."
  },
  {
    id: "miami",
    name: "Miami & South Florida (Southern Cross Astro)",
    shortName: "Miami",
    country: "United States",
    region: "Americas",
    icon: "🏖️",
    latitude: 25.7617,
    longitude: -80.1918,
    elevation: 2,
    observatory: "Southern Cross Astronomical Society & Biscayne Bay Sighting Post",
    description: "Subtropical Atlantic coastal station with southern sky crescent viewing advantages."
  },
  {
    id: "orlando",
    name: "Orlando & Central Florida (Crosby Observatory)",
    shortName: "Orlando",
    country: "United States",
    region: "Americas",
    icon: "🌴",
    latitude: 28.5383,
    longitude: -81.3792,
    elevation: 34,
    observatory: "Orlando Science Center Crosby Observatory",
    description: "Houses Florida's largest publicly accessible refractor telescope."
  },
  {
    id: "chicago",
    name: "Chicago (Adler Planetarium & Lakefront)",
    shortName: "Chicago",
    country: "United States",
    region: "Americas",
    icon: "🏙️",
    latitude: 41.8663,
    longitude: -87.6068,
    elevation: 182,
    observatory: "Adler Planetarium Doane Observatory",
    description: "Midwest hub featuring America's first public planetarium and lakeshore sighting vantage."
  },
  {
    id: "toronto",
    name: "Toronto (David Dunlap Observatory)",
    shortName: "Toronto",
    country: "Canada",
    region: "Americas",
    icon: "🍁",
    latitude: 43.8617,
    longitude: -79.4222,
    elevation: 240,
    observatory: "David Dunlap Observatory (74-inch reflector)",
    description: "Largest optical telescope in Canada, reference station for Canadian crescent sighters."
  },
  {
    id: "santiago",
    name: "Santiago (Cerro Calán National Observatory)",
    shortName: "Santiago",
    country: "Chile",
    region: "Americas",
    icon: "⛰️",
    latitude: -33.3972,
    longitude: -70.5369,
    elevation: 860,
    observatory: "Observatorio Astronómico Nacional de Chile",
    description: "Andean vantage with crystal-clear southern hemisphere sky transparency."
  },
  {
    id: "sao-paulo",
    name: "São Paulo (IAG Astronomical Station)",
    shortName: "São Paulo",
    country: "Brazil",
    region: "Americas",
    icon: "🇧🇷",
    latitude: -23.6517,
    longitude: -46.6231,
    elevation: 795,
    observatory: "IAG - Universidade de São Paulo",
    description: "South American metropolitan observatory monitoring southern crescent paths."
  },

  // Africa
  {
    id: "cape-town",
    name: "Cape Town (SAAO / Three Anchor Bay)",
    shortName: "Cape Town",
    country: "South Africa",
    region: "Africa",
    icon: "⛰️",
    latitude: -33.9180,
    longitude: 18.4048,
    elevation: 350,
    observatory: "South African Astronomical Observatory (SAAO)",
    description: "Famous gathering point on Signal Hill where South Africa's 'Maankykers' gather to spot the crescent."
  },
  {
    id: "algiers",
    name: "Algiers (Bouzareah Observatory - CRAAG)",
    shortName: "Algiers",
    country: "Algeria",
    region: "Africa",
    icon: "🇩🇿",
    latitude: 36.7972,
    longitude: 3.0306,
    elevation: 345,
    observatory: "Centre de Recherche en Astronomie Astrophysique et Géophysique (CRAAG)",
    description: "Perched 345m above the Mediterranean, key Maghreb hilal research and telemetry station."
  },
  {
    id: "nairobi",
    name: "Nairobi (Nairobi University Observatory)",
    shortName: "Nairobi",
    country: "Kenya",
    region: "Africa",
    icon: "🦒",
    latitude: -1.2783,
    longitude: 36.8156,
    elevation: 1680,
    observatory: "Chiromo Science Campus Observatory",
    description: "High-altitude equatorial station (1,680m) in East Africa with rapid sunset descents."
  },

  // Oceania
  {
    id: "sydney",
    name: "Sydney (Sydney Observatory / Observatory Hill)",
    shortName: "Sydney",
    country: "Australia",
    region: "Oceania",
    icon: "🦘",
    latitude: -33.8596,
    longitude: 151.2052,
    elevation: 42,
    observatory: "Sydney Observatory (Founded 1858)",
    description: "Heritage observatory on the heights of Millers Point, primary reference for Australian councils."
  },
  {
    id: "melbourne",
    name: "Melbourne (Mount Burnett Observatory)",
    shortName: "Melbourne",
    country: "Australia",
    region: "Oceania",
    icon: "🇦🇺",
    latitude: -37.9308,
    longitude: 145.5125,
    elevation: 250,
    observatory: "Mount Burnett Observatory, Dandenong Ranges",
    description: "Southern Australian observation post overlooking the Port Phillip basin."
  }
];
