import mongoose from 'mongoose';

const { ObjectId } = mongoose.Types;

const MAX_PERSONALIZED = 4;

const toObjectId = (id) => {
  try {
    return new ObjectId(id.toString());
  } catch {
    return id;
  }
};

const getUserId = (req) =>
  req.user?._id?.toString() || req.params?.userId || req.query?.userId;

const getTopTypes = (types) => {
  const count = {};
  types.forEach((t) => (count[t] = (count[t] || 0) + 1));
  return Object.entries(count)
    .sort((a, b) => b[1] - a[1])
    .map((e) => e[0])
    .slice(0, 3);
};

const filterHotels = (allHotels, types, location) =>
  allHotels.filter((hotel) => {
    const typeMatch = types.length === 0 || types.includes(hotel.hotelType);
    const locMatch =
      !location ||
      (() => {
        const search = location.toLowerCase().trim();
        if (!search) return true;
        const city = hotel.location?.city?.toLowerCase() ?? '';
        const state = hotel.location?.state?.toLowerCase() ?? '';
        const country = hotel.location?.country?.toLowerCase() ?? '';
        return (
          city.includes(search) ||
          state.includes(search) ||
          country.includes(search)
        );
      })();
    return typeMatch && locMatch;
  });

const getActiveOffers = async (db) => {
  const today = new Date().toISOString().split('T')[0];
  return db
    .collection('popularOffers')
    .find({
      isActive: true,
      validFrom: { $lte: today },
      validTo: { $gte: today },
    })
    .toArray();
};

const buildItems = (hotels, offers) => [
  ...hotels.map((h) => ({ kind: 'hotel', hotel: h })),
  ...offers.map((o) => ({ kind: 'offer', offer: o })),
];

const mergeResults = (personalized, popular) => {
  const personalizedSubset = personalized.slice(0, MAX_PERSONALIZED);
  const offerCount = 8 - personalizedSubset.length;
  return buildItems(personalizedSubset, popular.slice(0, offerCount));
};

// GET /api/recommendations?userId=xxx&location=xxx
export const getRecommendations = async (req, res) => {
  try {
    const { location } = req.query;
    const userId = req.query.userId || getUserId(req);
    const db = req.app.locals.db;

    const [allHotels, popularOffers] = await Promise.all([
      db.collection('hotels').find({ isActive: true }).toArray(),
      getActiveOffers(db),
    ]);

    if (!userId) return res.json(buildItems([], popularOffers));
        //path 1- get all positive reviews
    const positiveReviews = await db
      .collection('reviews')
      .find({
        userId: toObjectId(userId),
        rating: { $gte: 3 },
      })
      .toArray();

    if (positiveReviews.length > 0) {
      //  get types of hotels which user likes most
      const topTypes = getTopTypes(positiveReviews.map((r) => r.entityType));

      const personalized = filterHotels(allHotels, topTypes, location);
      return res.json(mergeResults(personalized, popularOffers));
    }
// path 2 - get data from bookings
    const bookings = await db
      .collection('hotelBookings')
      .find({ userId: toObjectId(userId) })
      .toArray();
    const bookedHotelIds = bookings.map((b) => b.hotelId?.toString());

    if (bookedHotelIds.length === 0)
      return res.json(buildItems([], popularOffers));

    const bookedHotels = allHotels.filter((h) =>
      bookedHotelIds.includes(h._id?.toString()),
    );
    const topTypes = getTopTypes(bookedHotels.map((h) => h.hotelType));
    const personalized = filterHotels(allHotels, topTypes, location);
    return res.json(mergeResults(personalized, popularOffers));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/recommendations/offer/:offerId
export const getOfferWithHotels = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const offer = await db
      .collection('popularOffers')
      .findOne({ _id: toObjectId(req.params.offerId) });
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    const hotels = await db
      .collection('hotels')
      .find({
        _id: { $in: (offer.applicableHotelIds ?? []).map(toObjectId) },
      })
      .toArray();

    res.json({ offer, hotels });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/recommendations/hotel/:hotelId
export const getHotelById = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const hotel = await db
      .collection('hotels')
      .findOne({ _id: toObjectId(req.params.hotelId) });
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    res.json([hotel]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
