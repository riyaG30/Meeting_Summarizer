import { Router } from 'express';
import Summary from '../models/Summary.js';
import mongoose from 'mongoose';
/**
 * Creates an Express router for handling summary-related operations.
 *
 * 
@eolrtns
 {Router} - An Express router instance.
 */
const router = Router();
/**
 * GET /team
 * Returns the current user's team name.
 */
router.get('/team', (req, res) => {
  const team = req.user?.team;
  if (!team) return res.status(400).send('Team not found in token');
  res.json({ team });
});
/**
 * Handles POST requests to create or replace a day's summary.
 */
router.post('/', async (req, res, next) => {
  console.log("Req", req.body);
  try {
    const { date, items } = req.body;
    const team = req.user.team;
    if (!team || !date || !Array.isArray(items)) {
      return res.status(400).send('date and items[] required');
    }
    console.log("Team", team);
    console.log("About to perform findOneAndUpdate with:", { team, date, itemsCount: items.length });
    // Check database connection state
    console.log("DB connection state:", mongoose.connection.readyState);
    const summary = await Summary.findOneAndUpdate(
      { team, date },
      { team, date, items },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    console.log("Summary returned:", summary);
    // IMPORTANT: Verify it's actually saved by querying again
    const verification = await Summary.findOne({ team, date });
    console.log("Verification query result:", verification);
    // Also check total count in collection
    const totalCount = await Summary.countDocuments({ team });
    console.log("Total documents for team:", totalCount);
    res.status(201).json(summary);
  } catch (err) {
    console.error("Route error:", err);
    next(err);
  }
});
/**
 * GET /search?date=YYYY-MM-DD&user=Alice
 * Retrieves a summary block for a specific user on a given date.
 */
router.get('/search', async (req, res, next) => {
  try {
    const team = req.user.team;
    const { date, user } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Missing required query param: date' });
    }
    if (user) {
      // Return only the matching user's item
      const doc = await Summary.findOne(
        { team, date, 'items.user': user },
        { _id: 0, items: { $elemMatch: { user } } }
      );
      if (!doc || !doc.items || doc.items.length === 0) {
        return res.status(404).json({ error: 'Record not found for the user' });
      }
      return res.json(doc.items[0]);
    } else {
      // Return the entire summary document (without _id)
      const doc = await Summary.findOne(
        { team, date },
        { _id: 0 }
      );
      if (!doc) {
        return res.status(404).json({ error: 'No summary found for the given date' });
      }
      return res.json(doc);
    }
  } catch (err) {
    next(err);
  }
});
/**
 * Handles GET requests to retrieve a full summary array for a given date.
 */
router.get('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    const team = req.user.team;
    const summary = await Summary.findOne({ team, date }).select('-_id team date items');
    if (!summary) return res.status(404).send('Not found');
    res.json(summary);
  } catch (err) { next(err); }
});
/**
 * Handles GET requests to retrieve all summaries belonging to a team.
 */
router.get('/', async (req, res, next) => {
  try {
    const team = req.user.team;
    const summaries = await Summary.find({ team }).select('-_id team date items');
    res.json(summaries);
  } catch (err) { next(err); }
});
export default router;





