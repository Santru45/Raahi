import "dotenv/config";
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/";

await mongoose.connect(MONGO_URI);
const db = mongoose.connection.db;

const col = db.collection("itineraries");

// Remove only std itineraries to avoid wiping user custom trips
await col.deleteMany({ type: "std" });

const toOid = (key) => {
  // simple string-based _id since the model uses String type
  return key;
};

await col.insertMany([
  {
    _id: "itn_001",
    user_id: null,
    trip_name: "Golden Triangle India",
    destination: "Delhi, Agra & Jaipur, India",
    start_date: "2026-04-10",
    end_date: "2026-04-17",
    type: "std",
    images: ["https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80"],
    created_at: "2026-01-15T09:00:00.000Z",
  },
  {
    _id: "itn_003",
    user_id: null,
    trip_name: "Backwaters of Kerala",
    destination: "Alleppey & Kumarakom, Kerala",
    start_date: "2026-08-15",
    end_date: "2026-08-22",
    type: "std",
    images: ["https://images.unsplash.com/photo-1593179241557-bce1eb92e47e?auto=format&fit=crop&w=800&q=80"],
    created_at: "2026-01-20T10:00:00.000Z",
  },
  {
    _id: "itn_004",
    user_id: null,
    trip_name: "Goa Beach Hopping",
    destination: "North & South Goa, India",
    start_date: "2026-11-10",
    end_date: "2026-11-15",
    type: "std",
    images: ["https://images.unsplash.com/photo-1512789172734-7b0997a39a05?auto=format&fit=crop&w=800&q=80"],
    created_at: "2026-03-10T14:30:00.000Z",
  },
  {
    _id: "itn_005",
    user_id: null,
    trip_name: "Royal Rajasthan Heritage",
    destination: "Jodhpur, Udaipur & Jaisalmer, Rajasthan",
    start_date: "2026-12-01",
    end_date: "2026-12-10",
    type: "std",
    images: ["https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80"],
    created_at: "2026-02-05T08:00:00.000Z",
  },
  {
    _id: "itn_007",
    user_id: null,
    trip_name: "Spiritual Varanasi & Sarnath",
    destination: "Varanasi & Sarnath, Uttar Pradesh",
    start_date: "2026-10-20",
    end_date: "2026-10-24",
    type: "std",
    images: ["https://images.unsplash.com/photo-1561359313-0639aad49ca6?auto=format&fit=crop&w=800&q=80"],
    created_at: "2026-02-15T09:45:00.000Z",
  },
  {
    _id: "itn_009",
    user_id: null,
    trip_name: "Hampi Historical Trail",
    destination: "Hampi, Karnataka",
    start_date: "2026-10-15",
    end_date: "2026-10-20",
    type: "std",
    images: ["https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80"],
    created_at: "2026-02-10T09:00:00.000Z",
  },
  {
    _id: "itn_010",
    user_id: null,
    trip_name: "Leh-Ladakh Adventure",
    destination: "Leh & Ladakh, Jammu & Kashmir",
    start_date: "2026-07-10",
    end_date: "2026-07-20",
    type: "std",
    images: ["https://images.unsplash.com/photo-1581791534721-e599df4417f7?auto=format&fit=crop&w=800&q=80"],
    created_at: "2026-03-22T15:30:00.000Z",
  },
  {
    _id: "itn_011",
    user_id: null,
    trip_name: "Mysore & Coorg Escape",
    destination: "Mysore & Coorg, Karnataka",
    start_date: "2026-11-01",
    end_date: "2026-11-07",
    type: "std",
    images: ["https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80"],
    created_at: "2026-01-30T10:15:00.000Z",
  },
]);

console.log("✅ Itineraries seeded successfully!");
await mongoose.disconnect();
