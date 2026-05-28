module.exports = (req, res, next) => {
  // Handle DELETE /users/:id
  if (req.method === "DELETE" && req.path.startsWith("/users/")) {
    const id = req.path.split("/").pop();
    const users = req.app.db.get("users").value();
    const index = users.findIndex((u) => u._id === id);

    if (index === -1) {
      return res.status(404).json({ error: "User not found" });
    }

    users.splice(index, 1);
    req.app.db.set("users", users).write();
    return res.status(200).json({ deleted: id });
  }

  // Handle DELETE /itineraries/:id  ← THIS WAS MISSING
  if (req.method === "DELETE" && req.path.startsWith("/itineraries/")) {
    const id = req.path.split("/").pop();
    const itineraries = req.app.db.get("itineraries").value();
    const index = itineraries.findIndex(
      (item) => item._id != null && String(item._id) === String(id)
    );

    if (index === -1) {
      return res.status(404).json({ error: "Itinerary not found" });
    }

    itineraries.splice(index, 1);
    req.app.db.set("itineraries", itineraries).write();
    return res.status(200).json({ deleted: id });
  }

  // Handle DELETE /itinerary_items/:id
  if (req.method === "DELETE" && req.path.startsWith("/itineraries/")) {
    const id = req.path.split("/").pop();
    const itineraries = req.app.db.get("itineraries").value();
    const index = itineraries.findIndex(
      (item) =>
        (item._id != null && String(item._id) === String(id)) ||
        (item.id != null && String(item.id) === String(id)), // fallback to id
    );

    if (index === -1) {
      return res.status(404).json({ error: "Itinerary not found" });
    }

    itineraries.splice(index, 1);
    req.app.db.set("itineraries", itineraries).write();
    return res.status(200).json({ deleted: id });
  }

  next();
};
