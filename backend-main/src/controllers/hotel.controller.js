import Hotel from "../models/hotel.model.js";

export const getAllHotels = async (req, res) => {
  try {
    const { city, starRating, amenities, hotelType, name, search } = req.query;
    const filter = {};

    if (search) {
      filter["$or"] = [
        { name: { $regex: search, $options: "i" } },
        { "location.city": { $regex: search, $options: "i" } },
      ];
    } else {
      if (city) filter["location.city"] = { $regex: city, $options: "i" };
      if (name) filter.name = { $regex: name, $options: "i" };
    }
    if (starRating) filter.starRating = { $gte: Number(starRating) };
    if (amenities) filter.amenities = { $all: amenities.split(",") };
    if (hotelType) {
      const types = hotelType.split(",");
      filter.hotelType = types.length === 1 ? types[0] : { $in: types };
    }

    res.json(await Hotel.find(filter));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getHotelById = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });
    res.json(hotel);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateHotel = async (req, res) => {
  try {
    const updated = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Hotel not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
