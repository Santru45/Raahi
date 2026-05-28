export const validateSeat = (req, res, next) => {
  const { serviceId, seatId, bookingReference } = req.body;

  if (!serviceId)
    return res.status(400).json({ message: 'serviceId is required' });

  if (!seatId) return res.status(400).json({ message: 'seatId is required' });

  if (!bookingReference)
    return res.status(400).json({ message: 'bookingReference is required' });

  next();
};
