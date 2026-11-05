export interface GlobalCityPreset {
  name: string;
  country: string;
  region: "Middle East" | "Asia" | "Europe" | "Americas" | "Africa" | "Oceania";
  latitude: number;
  longitude: number;
  elevation: number;
  observatory: string;
}

export const GLOBAL_CITIES_PRESETS: GlobalCityPreset[] = [
  // United States & Americas (including Dallas, Houston, Miami, Orlando, Chicago, etc.)
  {
    name: "Dallas, Texas",
    country: "United States",
    region: "Americas",
    latitude: 32.7767,
    longitude: -96.7970,
    elevation: 131,
    observatory: "Texas Astronomical Society & DFW Hilal Sighting Post"
  },
  {
    name: "Houston, Texas",
    country: "United States",
    region: "Americas",
    latitude: 29.7604,
    longitude: -95.3698,
    elevation: 15,
    observatory: "George Observatory & Greater Houston Hilal Committee"
  },
  {
    name: "Miami, Florida",
    country: "United States",
    region: "Americas",
    latitude: 25.7617,
    longitude: -80.1918,
    elevation: 2,
    observatory: "Southern Cross Astronomical Society & Biscayne Vantage"
  },
  {
    name: "Orlando, Florida",
    country: "United States",
    region: "Americas",
    latitude: 28.5383,
    longitude: -81.3792,
    elevation: 34,
    observatory: "Crosby Observatory & Central Florida Astro Society"
  },
  {
    name: "Tampa, Florida",
    country: "United States",
    region: "Americas",
    latitude: 27.9506,
    longitude: -82.4572,
    elevation: 14,
    observatory: "MOSI Saunders Planetarium & West Coast Florida Post"
  },
  {
    name: "Chicago, Illinois",
    country: "United States",
    region: "Americas",
    latitude: 41.8781,
    longitude: -87.6298,
    elevation: 181,
    observatory: "Adler Planetarium & Lake Michigan Sighting Post"
  },
  {
    name: "New York, New York",
    country: "United States",
    region: "Americas",
    latitude: 40.7128,
    longitude: -74.0060,
    elevation: 10,
    observatory: "Columbia Pupin Observatory & Tri-State Hilal Council"
  },
  {
    name: "Los Angeles, California",
    country: "United States",
    region: "Americas",
    latitude: 34.0522,
    longitude: -118.2437,
    elevation: 87,
    observatory: "Griffith Observatory, Mount Hollywood"
  },
  {
    name: "San Francisco, California",
    country: "United States",
    region: "Americas",
    latitude: 37.7749,
    longitude: -122.4194,
    elevation: 16,
    observatory: "Bay Area Astronomical Society & Pacific Coast Post"
  },
  {
    name: "Washington, D.C.",
    country: "United States",
    region: "Americas",
    latitude: 38.9072,
    longitude: -77.0369,
    elevation: 22,
    observatory: "U.S. Naval Observatory & Capital Crescent Committee"
  },
  {
    name: "Atlanta, Georgia",
    country: "United States",
    region: "Americas",
    latitude: 33.7490,
    longitude: -84.3880,
    elevation: 320,
    observatory: "Fernbank Science Center & Southeast Crescent Hub"
  },
  {
    name: "Denver, Colorado",
    country: "United States",
    region: "Americas",
    latitude: 39.7392,
    longitude: -104.9903,
    elevation: 1609,
    observatory: "Chamberlin Observatory & Rocky Mountain Clear Horizon"
  },
  {
    name: "Phoenix, Arizona",
    country: "United States",
    region: "Americas",
    latitude: 33.4484,
    longitude: -112.0740,
    elevation: 331,
    observatory: "Desert Foothills Astronomical Society"
  },
  {
    name: "Seattle, Washington",
    country: "United States",
    region: "Americas",
    latitude: 47.6062,
    longitude: -122.3321,
    elevation: 53,
    observatory: "Theodor Jacobsen Observatory & Pacific Northwest Watch"
  },
  {
    name: "Boston, Massachusetts",
    country: "United States",
    region: "Americas",
    latitude: 42.3601,
    longitude: -71.0589,
    elevation: 43,
    observatory: "Judson B. Coit Observatory & New England Hilal Council"
  },
  {
    name: "Detroit, Michigan",
    country: "United States",
    region: "Americas",
    latitude: 42.3314,
    longitude: -83.0458,
    elevation: 183,
    observatory: "Vollbrecht Planetarium & Great Lakes Hilal Council"
  },
  {
    name: "Philadelphia, Pennsylvania",
    country: "United States",
    region: "Americas",
    latitude: 39.9526,
    longitude: -75.1652,
    elevation: 12,
    observatory: "Bloom Observatory & Delaware Valley Watch"
  },
  {
    name: "Austin, Texas",
    country: "United States",
    region: "Americas",
    latitude: 30.2672,
    longitude: -97.7431,
    elevation: 149,
    observatory: "Painter Hall Observatory & Central Texas Sighters"
  },
  {
    name: "Toronto, Ontario",
    country: "Canada",
    region: "Americas",
    latitude: 43.6532,
    longitude: -79.3832,
    elevation: 76,
    observatory: "David Dunlap Observatory & Hilal Committee of Canada"
  },
  {
    name: "Vancouver, British Columbia",
    country: "Canada",
    region: "Americas",
    latitude: 49.2827,
    longitude: -123.1207,
    elevation: 70,
    observatory: "Gordon Southam Observatory & Pacific Sighting Post"
  },
  {
    name: "Montreal, Quebec",
    country: "Canada",
    region: "Americas",
    latitude: 45.5017,
    longitude: -73.5673,
    elevation: 70,
    observatory: "Mount Royal Astronomical Post & Quebec Hilal Watch"
  },

  // Pakistan & South Asia
  {
    name: "Lahore",
    country: "Pakistan",
    region: "Asia",
    latitude: 31.5204,
    longitude: 74.3587,
    elevation: 217,
    observatory: "Punjab University Astronomical Observatory"
  },
  {
    name: "Karachi",
    country: "Pakistan",
    region: "Asia",
    latitude: 24.8607,
    longitude: 67.0011,
    elevation: 8,
    observatory: "University of Karachi Astronomical Observatory & Arabian Sea Coast"
  },
  {
    name: "Islamabad / Rawalpindi",
    country: "Pakistan",
    region: "Asia",
    latitude: 33.6844,
    longitude: 73.0479,
    elevation: 540,
    observatory: "Margalla Ridge & Central Ruet-e-Hilal Committee Headquarters"
  },
  {
    name: "Peshawar",
    country: "Pakistan",
    region: "Asia",
    latitude: 34.0151,
    longitude: 71.5249,
    elevation: 359,
    observatory: "Qasim Ali Khan Regional Hilal Sighting Committee"
  },
  {
    name: "Faisalabad",
    country: "Pakistan",
    region: "Asia",
    latitude: 31.4504,
    longitude: 73.1350,
    elevation: 184,
    observatory: "Central Punjab Crescent Observation Center"
  },
  {
    name: "Multan",
    country: "Pakistan",
    region: "Asia",
    latitude: 30.1575,
    longitude: 71.5249,
    elevation: 122,
    observatory: "Bahauddin Zakariya University Observatory"
  },
  {
    name: "Quetta",
    country: "Pakistan",
    region: "Asia",
    latitude: 30.1798,
    longitude: 66.9750,
    elevation: 1680,
    observatory: "Chiltan Ridge High-Altitude Crescent Vantage"
  },
  {
    name: "Dhaka",
    country: "Bangladesh",
    region: "Asia",
    latitude: 23.8103,
    longitude: 90.4125,
    elevation: 4,
    observatory: "Islamic Foundation Bangladesh & National Moon Sighting Committee"
  },
  {
    name: "New Delhi",
    country: "India",
    region: "Asia",
    latitude: 28.6139,
    longitude: 77.2090,
    elevation: 216,
    observatory: "Central Hilal Committee of India & Jama Masjid Vantage"
  },
  {
    name: "Mumbai",
    country: "India",
    region: "Asia",
    latitude: 19.0760,
    longitude: 72.8777,
    elevation: 14,
    observatory: "Nehru Planetarium & Western Marine Drive Horizon"
  },
  {
    name: "Hyderabad",
    country: "India",
    region: "Asia",
    latitude: 17.3850,
    longitude: 78.4867,
    elevation: 542,
    observatory: "Nizamia Observatory & Deccan Hilal Committee"
  },

  // Middle East
  {
    name: "Mecca",
    country: "Saudi Arabia",
    region: "Middle East",
    latitude: 21.4225,
    longitude: 39.8262,
    elevation: 277,
    observatory: "Makkah Clock Royal Astronomical Center"
  },
  {
    name: "Medina",
    country: "Saudi Arabia",
    region: "Middle East",
    latitude: 24.4672,
    longitude: 39.6111,
    elevation: 608,
    observatory: "Al-Masjid an-Nabawi Regional Astronomical Station"
  },
  {
    name: "Riyadh",
    country: "Saudi Arabia",
    region: "Middle East",
    latitude: 24.7136,
    longitude: 46.6753,
    elevation: 612,
    observatory: "KACST Supreme Court Sighting Network"
  },
  {
    name: "Jeddah",
    country: "Saudi Arabia",
    region: "Middle East",
    latitude: 21.5433,
    longitude: 39.1728,
    elevation: 12,
    observatory: "Red Sea Coastal Astro Station & King Abdulaziz University"
  },
  {
    name: "Jerusalem / Al-Quds",
    country: "Palestine",
    region: "Middle East",
    latitude: 31.7767,
    longitude: 35.2345,
    elevation: 754,
    observatory: "Jabal az-Zaytoun Observational Post"
  },
  {
    name: "Dubai",
    country: "United Arab Emirates",
    region: "Middle East",
    latitude: 25.2048,
    longitude: 55.2708,
    elevation: 18,
    observatory: "Al Thuraya Astronomy Centre Mushrif Park"
  },
  {
    name: "Abu Dhabi",
    country: "United Arab Emirates",
    region: "Middle East",
    latitude: 24.4539,
    longitude: 54.3773,
    elevation: 7,
    observatory: "International Astronomical Center (IAC) Headquarters"
  },
  {
    name: "Doha",
    country: "Qatar",
    region: "Middle East",
    latitude: 25.2854,
    longitude: 51.5310,
    elevation: 13,
    observatory: "Qatar Calendar House & Crescent Sighting Committee"
  },
  {
    name: "Kuwait City",
    country: "Kuwait",
    region: "Middle East",
    latitude: 29.3759,
    longitude: 47.9774,
    elevation: 12,
    observatory: "Al-Ujairi Scientific Center Observatory"
  },
  {
    name: "Muscat",
    country: "Oman",
    region: "Middle East",
    latitude: 23.5880,
    longitude: 58.3829,
    elevation: 10,
    observatory: "Omani Astronomical Society & Ministry of Awqaf Network"
  },
  {
    name: "Amman",
    country: "Jordan",
    region: "Middle East",
    latitude: 31.9566,
    longitude: 35.9457,
    elevation: 850,
    observatory: "Jordanian Astronomical Society & ICOP Central Station"
  },
  {
    name: "Istanbul",
    country: "Turkey",
    region: "Middle East",
    latitude: 41.0082,
    longitude: 28.9784,
    elevation: 130,
    observatory: "Boğaziçi University Kandilli Observatory"
  },

  // Europe
  {
    name: "London",
    country: "United Kingdom",
    region: "Europe",
    latitude: 51.5074,
    longitude: -0.1278,
    elevation: 25,
    observatory: "Royal Observatory Greenwich & UK Sighting Network"
  },
  {
    name: "Birmingham",
    country: "United Kingdom",
    region: "Europe",
    latitude: 52.4862,
    longitude: -1.8904,
    elevation: 140,
    observatory: "West Midlands Astronomical Society & Central Mosque Watch"
  },
  {
    name: "Manchester",
    country: "United Kingdom",
    region: "Europe",
    latitude: 53.4808,
    longitude: -2.2426,
    elevation: 38,
    observatory: "Godlee Observatory & Northwest Hilal Committee"
  },
  {
    name: "Paris",
    country: "France",
    region: "Europe",
    latitude: 48.8566,
    longitude: 2.3522,
    elevation: 35,
    observatory: "Observatoire de Paris & Grande Mosquée de Paris"
  },
  {
    name: "Berlin",
    country: "Germany",
    region: "Europe",
    latitude: 52.5200,
    longitude: 13.4050,
    elevation: 34,
    observatory: "Archenhold Observatory & German Islamic Shura"
  },

  // Africa
  {
    name: "Cairo",
    country: "Egypt",
    region: "Africa",
    latitude: 30.0444,
    longitude: 31.2357,
    elevation: 23,
    observatory: "Helwan Observatory & Dar al-Ifta National Committee"
  },
  {
    name: "Cape Town",
    country: "South Africa",
    region: "Africa",
    latitude: -33.9180,
    longitude: 18.4048,
    elevation: 350,
    observatory: "Signal Hill Maankykers Post & SAAO"
  },
  {
    name: "Casablanca",
    country: "Morocco",
    region: "Africa",
    latitude: 33.5731,
    longitude: -7.5898,
    elevation: 27,
    observatory: "Hassan II Mosque Oceanfront Vantage & Habous Network"
  },
  {
    name: "Algiers",
    country: "Algeria",
    region: "Africa",
    latitude: 36.7972,
    longitude: 3.0306,
    elevation: 345,
    observatory: "Bouzareah CRAAG Observatory"
  },
  {
    name: "Nairobi",
    country: "Kenya",
    region: "Africa",
    latitude: -1.2783,
    longitude: 36.8156,
    elevation: 1680,
    observatory: "Chiromo Science Campus Observatory"
  },

  // Oceania
  {
    name: "Sydney",
    country: "Australia",
    region: "Oceania",
    latitude: -33.8596,
    longitude: 151.2052,
    elevation: 42,
    observatory: "Sydney Observatory & ANIC National Moon Sighting"
  },
  {
    name: "Melbourne",
    country: "Australia",
    region: "Oceania",
    latitude: -37.8136,
    longitude: 144.9631,
    elevation: 31,
    observatory: "Melbourne Observatory & Mount Burnett Vantage"
  }
];
