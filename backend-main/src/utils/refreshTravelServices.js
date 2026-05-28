import mongoose from "mongoose";
import TravelService from "../models/travel/TravelService.js";
import BoardingPoint from "../models/travel/BoardingPoint.js";

// Route templates

const FLIGHT_TEMPLATES = [
  // Chennai ↔ New Delhi
  {
    operatorName: "IndiGo",
    serviceNumber: "6E-204",
    from: "Chennai",
    to: "New Delhi",
    depHour: 6,
    depMin: 0,
    durationMin: 150,
    fare: 4500,
    marketRate: 6000,
    totalSeats: 180,
    cabinClass: "economy",
    amenities: ["Meal", "Charging Port"],
  },
  {
    operatorName: "SpiceJet",
    serviceNumber: "SG-142",
    from: "Chennai",
    to: "New Delhi",
    depHour: 9,
    depMin: 30,
    durationMin: 165,
    fare: 3800,
    marketRate: 5500,
    totalSeats: 189,
    cabinClass: "economy",
    amenities: ["Charging Port"],
  },
  {
    operatorName: "Air India",
    serviceNumber: "AI-143",
    from: "Chennai",
    to: "New Delhi",
    depHour: 14,
    depMin: 0,
    durationMin: 160,
    fare: 12500,
    marketRate: 15000,
    totalSeats: 48,
    cabinClass: "business",
    amenities: [
      "Gourmet Meal",
      "Wi-Fi",
      "Lounge Access",
      "Extra Legroom",
      "Priority Boarding",
    ],
  },
  {
    operatorName: "Vistara",
    serviceNumber: "UK-770",
    from: "Chennai",
    to: "New Delhi",
    depHour: 18,
    depMin: 45,
    durationMin: 155,
    fare: 6200,
    marketRate: 8000,
    totalSeats: 170,
    cabinClass: "premium economy",
    amenities: ["Meal", "Entertainment", "Priority Boarding", "Extra Legroom"],
  },
  {
    operatorName: "IndiGo",
    serviceNumber: "6E-518",
    from: "Chennai",
    to: "New Delhi",
    depHour: 22,
    depMin: 0,
    durationMin: 150,
    fare: 3200,
    marketRate: 4800,
    totalSeats: 180,
    cabinClass: "economy",
    amenities: ["Charging Port"],
  },
  // Chennai ↔ Mumbai
  {
    operatorName: "Air India",
    serviceNumber: "AI-560",
    from: "Chennai",
    to: "Mumbai",
    depHour: 10,
    depMin: 15,
    durationMin: 135,
    fare: 5200,
    marketRate: 7100,
    totalSeats: 220,
    cabinClass: "economy",
    amenities: ["Meal", "Entertainment", "Blanket"],
  },
  {
    operatorName: "Vistara",
    serviceNumber: "UK-886",
    from: "Chennai",
    to: "Mumbai",
    depHour: 15,
    depMin: 30,
    durationMin: 135,
    fare: 10800,
    marketRate: 13500,
    totalSeats: 40,
    cabinClass: "business",
    amenities: [
      "Gourmet Meal",
      "Wi-Fi",
      "Lounge Access",
      "Flat Bed",
      "Premium Amenity Kit",
    ],
  },
  {
    operatorName: "IndiGo",
    serviceNumber: "6E-372",
    from: "Chennai",
    to: "Mumbai",
    depHour: 7,
    depMin: 0,
    durationMin: 130,
    fare: 4800,
    marketRate: 6500,
    totalSeats: 186,
    cabinClass: "economy",
    amenities: ["Charging Port", "Snacks"],
  },
  // Bangalore ↔ Kolkata
  {
    operatorName: "Vistara",
    serviceNumber: "UK-824",
    from: "Bangalore",
    to: "Kolkata",
    depHour: 14,
    depMin: 0,
    durationMin: 165,
    fare: 7200,
    marketRate: 9000,
    totalSeats: 160,
    cabinClass: "premium economy",
    amenities: ["Meal", "Wi-Fi", "Extra Legroom", "Priority Boarding"],
  },
  {
    operatorName: "Air India",
    serviceNumber: "AI-762",
    from: "Bangalore",
    to: "Kolkata",
    depHour: 9,
    depMin: 15,
    durationMin: 155,
    fare: 5600,
    marketRate: 7500,
    totalSeats: 200,
    cabinClass: "economy",
    amenities: ["Meal", "Entertainment"],
  },
  // Mumbai ↔ Goa
  {
    operatorName: "IndiGo",
    serviceNumber: "6E-6191",
    from: "Mumbai",
    to: "Goa",
    depHour: 8,
    depMin: 30,
    durationMin: 75,
    fare: 3200,
    marketRate: 4500,
    totalSeats: 180,
    cabinClass: "economy",
    amenities: ["Charging Port"],
  },
  {
    operatorName: "Vistara",
    serviceNumber: "UK-969",
    from: "Mumbai",
    to: "Goa",
    depHour: 11,
    depMin: 0,
    durationMin: 75,
    fare: 4800,
    marketRate: 6200,
    totalSeats: 156,
    cabinClass: "premium economy",
    amenities: ["Meal", "Extra Legroom", "Priority Boarding"],
  },
  // Hyderabad ↔ Bangalore
  {
    operatorName: "Air India",
    serviceNumber: "AI-541",
    from: "Hyderabad",
    to: "Bangalore",
    depHour: 6,
    depMin: 45,
    durationMin: 75,
    fare: 2800,
    marketRate: 4000,
    totalSeats: 180,
    cabinClass: "economy",
    amenities: ["Snacks", "Charging Port"],
  },
  {
    operatorName: "IndiGo",
    serviceNumber: "6E-795",
    from: "Hyderabad",
    to: "Bangalore",
    depHour: 13,
    depMin: 30,
    durationMin: 75,
    fare: 2500,
    marketRate: 3800,
    totalSeats: 186,
    cabinClass: "economy",
    amenities: ["Charging Port"],
  },
  // New Delhi ↔ Agra (short)
  {
    operatorName: "Alliance Air",
    serviceNumber: "9I-622",
    from: "New Delhi",
    to: "Agra",
    depHour: 7,
    depMin: 0,
    durationMin: 45,
    fare: 2200,
    marketRate: 3200,
    totalSeats: 70,
    cabinClass: "economy",
    amenities: ["Snacks"],
  },
  // Bangalore ↔ Goa
  {
    operatorName: "IndiGo",
    serviceNumber: "6E-6117",
    from: "Bangalore",
    to: "Goa",
    depHour: 10,
    depMin: 30,
    durationMin: 75,
    fare: 3500,
    marketRate: 5000,
    totalSeats: 180,
    cabinClass: "economy",
    amenities: ["Charging Port"],
  },
  {
    operatorName: "Air India",
    serviceNumber: "AI-624",
    from: "Bangalore",
    to: "Goa",
    depHour: 16,
    depMin: 0,
    durationMin: 75,
    fare: 8500,
    marketRate: 11000,
    totalSeats: 36,
    cabinClass: "business",
    amenities: ["Gourmet Meal", "Wi-Fi", "Lounge Access", "Extra Legroom"],
  },
  // New Delhi ↔ Mumbai
  {
    operatorName: "IndiGo",
    serviceNumber: "6E-101",
    from: "New Delhi",
    to: "Mumbai",
    depHour: 5,
    depMin: 45,
    durationMin: 140,
    fare: 4200,
    marketRate: 5800,
    totalSeats: 180,
    cabinClass: "economy",
    amenities: ["Meal", "Charging Port"],
  },
  {
    operatorName: "Air India",
    serviceNumber: "AI-865",
    from: "New Delhi",
    to: "Mumbai",
    depHour: 12,
    depMin: 0,
    durationMin: 135,
    fare: 5800,
    marketRate: 7500,
    totalSeats: 200,
    cabinClass: "economy",
    amenities: ["Meal", "Entertainment", "Blanket"],
  },
  {
    operatorName: "Vistara",
    serviceNumber: "UK-955",
    from: "New Delhi",
    to: "Mumbai",
    depHour: 20,
    depMin: 0,
    durationMin: 140,
    fare: 9500,
    marketRate: 12000,
    totalSeats: 42,
    cabinClass: "business",
    amenities: ["Gourmet Meal", "Wi-Fi", "Flat Bed", "Lounge Access"],
  },
];

const TRAIN_TEMPLATES = [
  {
    operatorName: "Indian Railways",
    serviceNumber: "12050 Gatimaan Express",
    from: "New Delhi",
    to: "Agra",
    depHour: 8,
    depMin: 10,
    durationMin: 110,
    fare: 800,
    marketRate: 1000,
    totalSeats: 200,
    cabinClass: "ac chair car",
    amenities: ["Meal", "Charging Point"],
  },
  {
    operatorName: "Indian Railways",
    serviceNumber: "12621 Tamil Nadu Exp",
    from: "Chennai",
    to: "New Delhi",
    depHour: 22,
    depMin: 0,
    durationMin: 1890,
    fare: 1850,
    marketRate: 2100,
    totalSeats: 72,
    cabinClass: "3ac",
    amenities: ["Pantry Car", "Charging Point", "Bedroll"],
  },
  {
    operatorName: "Indian Railways",
    serviceNumber: "12625 Shatabdi Exp",
    from: "Bangalore",
    to: "Chennai",
    depHour: 6,
    depMin: 0,
    durationMin: 300,
    fare: 750,
    marketRate: 900,
    totalSeats: 120,
    cabinClass: "ac chair car",
    amenities: ["Charging Point", "Catering"],
  },
  {
    operatorName: "Indian Railways",
    serviceNumber: "12301 Rajdhani Exp",
    from: "New Delhi",
    to: "Kolkata",
    depHour: 17,
    depMin: 0,
    durationMin: 1020,
    fare: 2400,
    marketRate: 2800,
    totalSeats: 58,
    cabinClass: "2ac",
    amenities: ["Meal", "Bedroll", "Charging Point", "Pantry Car"],
  },
  {
    operatorName: "Indian Railways",
    serviceNumber: "12951 Rajdhani Exp",
    from: "Mumbai",
    to: "New Delhi",
    depHour: 16,
    depMin: 35,
    durationMin: 960,
    fare: 2600,
    marketRate: 3000,
    totalSeats: 60,
    cabinClass: "2ac",
    amenities: ["Meal", "Bedroll", "Charging Point"],
  },
  {
    operatorName: "Indian Railways",
    serviceNumber: "12028 Shatabdi Exp",
    from: "New Delhi",
    to: "Chandigarh",
    depHour: 7,
    depMin: 40,
    durationMin: 210,
    fare: 650,
    marketRate: 800,
    totalSeats: 150,
    cabinClass: "ac chair car",
    amenities: ["Meal", "Charging Point"],
  },
  {
    operatorName: "Indian Railways",
    serviceNumber: "12723 Telangana Exp",
    from: "Hyderabad",
    to: "New Delhi",
    depHour: 6,
    depMin: 30,
    durationMin: 1560,
    fare: 1600,
    marketRate: 1900,
    totalSeats: 64,
    cabinClass: "3ac",
    amenities: ["Pantry Car", "Charging Point"],
  },
  {
    operatorName: "Indian Railways",
    serviceNumber: "12658 Chennai Mail",
    from: "Bangalore",
    to: "Chennai",
    depHour: 23,
    depMin: 0,
    durationMin: 360,
    fare: 450,
    marketRate: 600,
    totalSeats: 90,
    cabinClass: "sleeper",
    amenities: ["Charging Point"],
  },
  {
    operatorName: "Indian Railways",
    serviceNumber: "12502 Rajdhani Exp",
    from: "Bangalore",
    to: "New Delhi",
    depHour: 20,
    depMin: 0,
    durationMin: 2040,
    fare: 3200,
    marketRate: 3800,
    totalSeats: 48,
    cabinClass: "1ac",
    amenities: ["Gourmet Meal", "Bedroll", "Attendant", "Charging Point"],
  },
];

const BUS_TEMPLATES = [
  {
    operatorName: "KPN Travels",
    serviceNumber: "KPN-501",
    from: "Chennai",
    to: "Bangalore",
    depHour: 22,
    depMin: 0,
    durationMin: 450,
    fare: 850,
    marketRate: 1000,
    totalSeats: 36,
    cabinClass: "multi-axle sleeper",
    amenities: ["Blanket", "Water Bottle", "Charging Point"],
  },
  {
    operatorName: "SRS Travels",
    serviceNumber: "SRS-302",
    from: "Chennai",
    to: "Madurai",
    depHour: 21,
    depMin: 30,
    durationMin: 450,
    fare: 650,
    marketRate: 800,
    totalSeats: 40,
    cabinClass: "ac sleeper",
    amenities: ["Blanket", "Water Bottle"],
  },
  {
    operatorName: "Orange Travels",
    serviceNumber: "OT-910",
    from: "Hyderabad",
    to: "Bangalore",
    depHour: 20,
    depMin: 0,
    durationMin: 600,
    fare: 950,
    marketRate: 1100,
    totalSeats: 30,
    cabinClass: "volvo ac seater",
    amenities: ["Wi-Fi", "Entertainment", "Snacks", "Charging Point"],
  },
  {
    operatorName: "VRL Travels",
    serviceNumber: "VRL-777",
    from: "Bangalore",
    to: "Goa",
    depHour: 19,
    depMin: 0,
    durationMin: 720,
    fare: 1100,
    marketRate: 1400,
    totalSeats: 36,
    cabinClass: "multi-axle sleeper",
    amenities: ["Blanket", "Water Bottle", "Charging Point", "Snacks"],
  },
  {
    operatorName: "Neeta Travels",
    serviceNumber: "NT-420",
    from: "Mumbai",
    to: "Goa",
    depHour: 20,
    depMin: 30,
    durationMin: 600,
    fare: 900,
    marketRate: 1200,
    totalSeats: 40,
    cabinClass: "ac sleeper",
    amenities: ["Blanket", "Water Bottle", "Entertainment"],
  },
  {
    operatorName: "KPN Travels",
    serviceNumber: "KPN-612",
    from: "Chennai",
    to: "Madurai",
    depHour: 23,
    depMin: 0,
    durationMin: 420,
    fare: 700,
    marketRate: 850,
    totalSeats: 36,
    cabinClass: "multi-axle sleeper",
    amenities: ["Blanket", "Water Bottle", "Charging Point"],
  },
  {
    operatorName: "Kallada Travels",
    serviceNumber: "KL-305",
    from: "Bangalore",
    to: "Chennai",
    depHour: 22,
    depMin: 30,
    durationMin: 390,
    fare: 800,
    marketRate: 950,
    totalSeats: 38,
    cabinClass: "ac sleeper",
    amenities: ["Blanket", "Water Bottle", "Charging Point"],
  },
  {
    operatorName: "APSRTC",
    serviceNumber: "AP-1234",
    from: "Hyderabad",
    to: "Chennai",
    depHour: 18,
    depMin: 0,
    durationMin: 720,
    fare: 750,
    marketRate: 900,
    totalSeats: 44,
    cabinClass: "ac seater",
    amenities: ["Water Bottle", "Charging Point"],
  },
  {
    operatorName: "Orange Travels",
    serviceNumber: "OT-505",
    from: "Hyderabad",
    to: "Goa",
    depHour: 17,
    depMin: 30,
    durationMin: 780,
    fare: 1200,
    marketRate: 1500,
    totalSeats: 32,
    cabinClass: "volvo ac sleeper",
    amenities: ["Blanket", "Water Bottle", "Snacks", "Charging Point", "Wi-Fi"],
  },
];

// ─── Boarding / Drop Point Templates (keyed by bus serviceNumber) ────────────
const BUS_POINTS = {
  "KPN-501": {
    boarding: [
      {
        name: "Koyambedu CMBT",
        time: "22:00",
        landmark: "Near CMBT Metro Station",
      },
      { name: "Tambaram", time: "22:30", landmark: "Tambaram Railway Station" },
      { name: "Guindy", time: "22:15", landmark: "Guindy Race Course" },
    ],
    drop: [
      {
        name: "Bangalore Electronic City",
        time: "05:15",
        landmark: "Electronic City Phase 1",
      },
      {
        name: "Bangalore Silk Board",
        time: "05:00",
        landmark: "Silk Board Junction",
      },
      {
        name: "Bangalore Majestic",
        time: "05:30",
        landmark: "Majestic Bus Stand",
      },
    ],
  },
  "SRS-302": {
    boarding: [
      {
        name: "Chennai Koyambedu",
        time: "21:30",
        landmark: "Koyambedu Bus Stand",
      },
      {
        name: "Chennai Tambaram",
        time: "22:00",
        landmark: "Tambaram Bus Stop",
      },
    ],
    drop: [
      {
        name: "Madurai Periyar Bus Stand",
        time: "04:45",
        landmark: "Main Bus Stand",
      },
      {
        name: "Madurai Anna Nagar",
        time: "05:00",
        landmark: "Anna Nagar 2nd Street",
      },
    ],
  },
  "OT-910": {
    boarding: [
      {
        name: "Hyderabad MGBS",
        time: "20:00",
        landmark: "Mahatma Gandhi Bus Station",
      },
      {
        name: "Hyderabad LB Nagar",
        time: "20:30",
        landmark: "LB Nagar Metro Station",
      },
    ],
    drop: [
      {
        name: "Bangalore Silk Board",
        time: "05:45",
        landmark: "Silk Board Junction",
      },
      {
        name: "Bangalore Majestic",
        time: "06:00",
        landmark: "Majestic Bus Stand",
      },
    ],
  },
  "VRL-777": {
    boarding: [
      {
        name: "Bangalore Majestic",
        time: "19:00",
        landmark: "Majestic Bus Stand",
      },
      {
        name: "Bangalore Yeshwantpur",
        time: "19:30",
        landmark: "Yeshwantpur Railway Station",
      },
    ],
    drop: [
      { name: "Goa Madgaon", time: "07:00", landmark: "Madgaon Bus Stand" },
      { name: "Goa Panjim", time: "07:30", landmark: "Panjim KTC Bus Stand" },
    ],
  },
  "NT-420": {
    boarding: [
      {
        name: "Mumbai Borivali",
        time: "20:30",
        landmark: "Borivali Bus Depot",
      },
      { name: "Mumbai Dadar", time: "21:00", landmark: "Dadar TT Circle" },
    ],
    drop: [
      { name: "Goa Madgaon", time: "06:30", landmark: "Madgaon Bus Stand" },
      { name: "Goa Mapusa", time: "07:00", landmark: "Mapusa Bus Stand" },
    ],
  },
  "KPN-612": {
    boarding: [
      {
        name: "Chennai Koyambedu",
        time: "23:00",
        landmark: "Koyambedu Bus Stand",
      },
      { name: "Chennai Guindy", time: "23:20", landmark: "Guindy Bus Stop" },
    ],
    drop: [
      {
        name: "Madurai Periyar Bus Stand",
        time: "06:00",
        landmark: "Main Bus Stand",
      },
      {
        name: "Madurai Mattuthavani",
        time: "06:15",
        landmark: "Mattuthavani Bus Stand",
      },
    ],
  },
  "KL-305": {
    boarding: [
      {
        name: "Bangalore Majestic",
        time: "22:30",
        landmark: "Majestic Bus Stand",
      },
      {
        name: "Bangalore Electronic City",
        time: "23:00",
        landmark: "Electronic City Toll",
      },
    ],
    drop: [
      { name: "Chennai Koyambedu", time: "05:00", landmark: "Koyambedu CMBT" },
      { name: "Chennai Guindy", time: "05:15", landmark: "Guindy Race Course" },
    ],
  },
  "AP-1234": {
    boarding: [
      {
        name: "Hyderabad MGBS",
        time: "18:00",
        landmark: "Mahatma Gandhi Bus Station",
      },
      {
        name: "Hyderabad Dilsukhnagar",
        time: "18:30",
        landmark: "Dilsukhnagar Bus Stop",
      },
    ],
    drop: [
      { name: "Chennai Koyambedu", time: "06:00", landmark: "Koyambedu CMBT" },
      {
        name: "Chennai Tambaram",
        time: "06:30",
        landmark: "Tambaram Bus Stop",
      },
    ],
  },
  "OT-505": {
    boarding: [
      {
        name: "Hyderabad MGBS",
        time: "17:30",
        landmark: "Mahatma Gandhi Bus Station",
      },
      {
        name: "Hyderabad Aramghar",
        time: "18:00",
        landmark: "Aramghar X Roads",
      },
    ],
    drop: [
      { name: "Goa Madgaon", time: "06:30", landmark: "Madgaon Bus Stand" },
      { name: "Goa Panjim", time: "07:00", landmark: "Panjim KTC Bus Stand" },
    ],
  },
};

// Helpers
function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function varyFare(baseFare) {
  const variance = 0.08;
  const factor = 1 + (Math.random() * 2 - 1) * variance;
  return Math.round((baseFare * factor) / 50) * 50; // round to nearest 50
}

/**
 * Generates a service document for a given template + date.
 * depHour/depMin in templates are IST (UTC+5:30), store as UTC in DB.
 */
function generateService(template, date, type) {
  const dep = new Date(date);
  // Convert IST hours to UTC (subtract 5:30)
  const totalMinIST = template.depHour * 60 + template.depMin;
  const totalMinUTC = totalMinIST - 330; // IST is UTC+330min
  if (totalMinUTC < 0) {
    // Previous UTC day
    dep.setUTCDate(dep.getUTCDate() - 1);
    dep.setUTCHours(
      Math.floor((totalMinUTC + 1440) / 60),
      (totalMinUTC + 1440) % 60,
      0,
      0,
    );
  } else {
    dep.setUTCHours(Math.floor(totalMinUTC / 60), totalMinUTC % 60, 0, 0);
  }

  const arr = new Date(dep.getTime() + template.durationMin * 60 * 1000);

  const fare = varyFare(template.fare);
  const marketRate = Math.round(fare * (template.marketRate / template.fare));
  const availableSeats = randomBetween(
    Math.floor(template.totalSeats * 0.3),
    template.totalSeats - 2,
  );

  return {
    type,
    operatorName: template.operatorName,
    serviceNumber: template.serviceNumber,
    from: template.from,
    to: template.to,
    schedule: {
      departureTime: dep,
      arrivalTime: arr,
      duration: formatDuration(template.durationMin),
    },
    fare,
    marketRate,
    totalSeats: template.totalSeats,
    availableSeats,
    cabinClass: template.cabinClass,
    amenities: template.amenities,
    taxPercent: 5,
    isActive: true,
  };
}

export async function refreshTravelServices() {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Remove past services
    await TravelService.deleteMany({
      "schedule.departureTime": { $lt: today },
    });

    // Generate for today + 7 days
    const DAYS_AHEAD = 7;
    const services = [];

    for (let dayOffset = 0; dayOffset <= DAYS_AHEAD; dayOffset++) {
      const date = new Date(today);
      date.setUTCDate(date.getUTCDate() + dayOffset);

            for (const tmpl of FLIGHT_TEMPLATES) {
        services.push(generateService(tmpl, date, "flight"));
      }

            for (const tmpl of TRAIN_TEMPLATES) {
        services.push(generateService(tmpl, date, "train"));
      }

            for (const tmpl of BUS_TEMPLATES) {
        services.push(generateService(tmpl, date, "bus"));
      }
    }

    // Avoid duplicates: only insert services that don't already exist
    // (same serviceNumber + same departureTime)
    let inserted = 0;
    for (const svc of services) {
      const exists = await TravelService.findOne({
        serviceNumber: svc.serviceNumber,
        "schedule.departureTime": svc.schedule.departureTime,
      });
      if (!exists) {
        const created = await TravelService.create(svc);
        inserted++;

        // Add boarding points for buses
        if (svc.type === "bus" && BUS_POINTS[svc.serviceNumber]) {
          const pointTemplates = BUS_POINTS[svc.serviceNumber];
          const pointDocs = [];
          for (const bp of pointTemplates.boarding) {
            pointDocs.push({ serviceId: created._id, type: "boarding", ...bp });
          }
          for (const dp of pointTemplates.drop) {
            pointDocs.push({ serviceId: created._id, type: "drop", ...dp });
          }
          await BoardingPoint.insertMany(pointDocs);
        }
      }
    }

    // Remove orphaned boarding points
    const activeServiceIds = await TravelService.find({}, "_id").lean();
    const activeIds = activeServiceIds.map((s) => s._id);
    await BoardingPoint.deleteMany({ serviceId: { $nin: activeIds } });

    const totalBP = await BoardingPoint.countDocuments();
    const total = await TravelService.countDocuments({ isActive: true });
    console.log(
      `✈️  Travel services refreshed: ${inserted} new added, ${total} total active services (today + ${DAYS_AHEAD} days)`,
    );
    console.log(
      `📍 Boarding points: ${totalBP} active points linked to bus services`,
    );
  } catch (err) {
    console.error("❌ Error refreshing travel services:", err.message);
  }
}
