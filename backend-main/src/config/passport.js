import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { userModel } from '../models/user.model.js';
import bcrypt from 'bcrypt';

export default function configurePassport() {
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      async function (email, password, done) {
        try {
          const user = await userModel.findOne({ email });
          if (!user)
            return done(null, false, { message: 'Email not registered' });

          const isMatch = await bcrypt.compare(password, user.passwordHash);
          
          if (!isMatch)
            return done(null, false, { message: 'Incorrect Password' });

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      },
    ),
  );

  const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
  };

  passport.use(
    new JwtStrategy(options, async (payload, done) => {
      try {
        const user = await userModel.findById(payload.id); // ← fixed
        if (user) return done(null, user);
        return done(null, false, { message: 'User not found: JwtStrategy' });
      } catch (error) {
        return done(error);
      }
    }),
  );
}
