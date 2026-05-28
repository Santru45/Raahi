// ── ROOM INVENTORY ───────────────────────────────────────────

export interface RoomInventory {
  _id:           string;
  hotelId:       string;
  roomId:        string;
  date:          Date;
  totalRooms:    number;
  bookedRooms:   number;
  blockedRooms:  number;
  // availableRooms = totalRooms - bookedRooms - blockedRooms
}

// ── ROOM PRICING ─────────────────────────────────────────────

export interface RoomPricing {
  _id:        string;
  hotelId:    string;
  roomId:     string;
  date:       Date;
  price:      number;
}