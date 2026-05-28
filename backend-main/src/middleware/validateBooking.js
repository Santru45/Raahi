export const validateBooking = (req, res, next) => {
  const { serviceId, passengers, pricing, bookingReference } = req.body;

  if (!serviceId)
    return res.status(400).json({ message: 'serviceId is required' });

  if (!bookingReference)
    return res.status(400).json({ message: 'bookingReference is required' });

  if (!passengers || !Array.isArray(passengers) || passengers.length === 0)
    return res
      .status(400)
      .json({ message: 'At least one passenger is required' });

  for (let i = 0; i < passengers.length; i++) {
    const p = passengers[i];
    if (!p.firstName || !p.lastName)
      return res
        .status(400)
        .json({
          message: `Passenger ${i + 1}: firstName and lastName are required`,
        });
    if (!p.idType || !p.idNumber)
      return res
        .status(400)
        .json({
          message: `Passenger ${i + 1}: idType and idNumber are required`,
        });
  }

  if (!pricing) return res.status(400).json({ message: 'pricing is required' });

  if (!pricing.totalAmount || pricing.totalAmount <= 0)
    return res.status(400).json({ message: 'Invalid total amount' });

  next();
};
