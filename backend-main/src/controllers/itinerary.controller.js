import Itinerary from '../models/itinerary/Itinerary.js';

export const getAllItineraries = async (req, res) => {
  try {
    const itineraries = await Itinerary.find().sort({ created_at: -1 });
    res.json(itineraries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getItineraryById = async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary)
      return res.status(404).json({ error: 'Itinerary not found' });
    res.json(itinerary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createItinerary = async (req, res) => {
  try {
    const { user_id, trip_name, destination, start_date, end_date, image_url } = req.body;
    const itinerary = new Itinerary({
      _id: `itn_${Date.now()}`,
      user_id: user_id ?? null,
      trip_name,
      destination: destination ?? null,
      start_date,
      end_date,
      type: 'custom',
      images: image_url
        ? [image_url]
        : [
            'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80',
          ],
    });
    const saved = await itinerary.save();
    res.status(201).json(saved);
  } catch (err) {
    if (err.name === 'ValidationError')
      return res.status(400).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
};

export const patchItinerary = async (req, res) => {
  try {
    const allowed = [
      'start_date',
      'end_date',
      'trip_name',
      'destination',
      'images',
      'image_url',
    ];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });
    if (updates.image_url !== undefined) {
      updates.images = updates.image_url ? [updates.image_url] : [];
      delete updates.image_url;
    }
    const updated = await Itinerary.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true },
    );
    if (!updated) return res.status(404).json({ error: 'Itinerary not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteItinerary = async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary)
      return res.status(404).json({ error: 'Itinerary not found' });
    await Itinerary.findByIdAndDelete(req.params.id);
    res.json({ deleted: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
