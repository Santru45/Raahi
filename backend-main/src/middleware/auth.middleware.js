import passport from "passport";

// Runs passport and attaches user to req
function authenticate(strategy) {
  return (req, res, next) => {
    passport.authenticate(strategy, { session: false }, (err, user, info) => {
      if (err) return res.status(500).json({ message: "Authentication error" });
      if (!user)
        return res
          .status(401)
          .json({ message: info?.message || "Unauthorized" });
      req.user = user;
      next();
    })(req, res, next);
  };
}

export default authenticate;

// Named export alias
export { authenticate };
