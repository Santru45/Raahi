import ItineraryItem from '../models/itinerary/ItineraryItem.js';
import Itinerary from '../models/itinerary/Itinerary.js';

export const getAllItems = async (req, res) => {
  try {
    const { itinerary_id } = req.query;
    const filter = itinerary_id ? { itinerary_id } : {};
    const items = await ItineraryItem.find(filter);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getItemById = async (req, res) => {
  try {
    const item = await ItineraryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createItem = async (req, res) => {
  try {
    const {
      itinerary_id,
      category,
      title,
      location,
      date,
      notes,
      status,
      sort_order,
      source_booking_ref,
    } = req.body;

    const itinerary = await Itinerary.findById(itinerary_id);
    if (!itinerary)
      return res.status(404).json({ error: 'Parent itinerary not found' });

    const item = new ItineraryItem({
      _id: `itm_${Date.now()}`,
      itinerary_id,
      category,
      title,
      location,
      date: date || null,
      notes: notes || '',
      status: status || 'confirmed',
      sort_order: sort_order ?? null,
      source_booking_ref: source_booking_ref || null,
    });

    const saved = await item.save();
    res.status(201).json(saved);
  } catch (err) {
    if (err.name === 'ValidationError')
      return res.status(400).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const item = await ItineraryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    await ItineraryItem.findByIdAndDelete(req.params.id);
    res.json({ deleted: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
