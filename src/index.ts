import 'dotenv/config';
import express, { Application } from 'express';
import { logger, errorMiddleware } from './utils';
import passport from 'passport';
import session from 'express-session';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { mainRoutes } from './Routes';

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up session middleware
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Middleware for parsing JSON requests
app.use(express.json());

// Twitter OAuth Strategy
passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_API_KEY || '',
      consumerSecret: process.env.TWITTER_API_SECRET || '',
      callbackURL: process.env.CALLBACK_URL || '',
    },
    (token, tokenSecret, profile, done) => {
      return done(null, profile);
    }
  )
);

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj!);
});

// Authentication routes
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get(
  '/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/' }),
  (req, res) => {
    res.send('Authenticated successfully! 🎉');
  }
);

app.use('/api', mainRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use(errorMiddleware);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

export default app;
