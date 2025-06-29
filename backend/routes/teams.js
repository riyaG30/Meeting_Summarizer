import { Router } from 'express';
import bcrypt from 'bcrypt';
import Team from '../models/Team.js';
import { generateToken } from '../utils/jwt.js';

/**
 * Creates an Express router for handling team-related operations, such as registration and login.
 *
 * @returns {Router} - An Express router instance.
 */
const router = Router();
const SALT_ROUNDS = 10;

/**
 * Handles POST requests to register a new team.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @throws {Error} - Throws an error if the team already exists or during the registration process.
 */
router.post('/', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    console.log(username, password);
    const existingTeam = await Team.findOne({ username });
    if (existingTeam) return res.status(400).send('Team already exists');

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const team = await Team.create({ username, password: hashedPassword });

    res.status(201).json(team);
  } catch (err) {
    next(err);
  }
});

/**
 * Handles POST requests to log in and receive a JWT.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @throws {Error} - Throws an error during the login process.
 */
router.post('/login', async (req, res, next) => {
  try {
    const {username, password } = req.body;
    console.log(username,password);
    console.log(req.body);
    const team = await Team.findOne({ username });
    console.log(team);
    if (!team) return res.status(401).send('Invalid credentials');

    const isMatch = await bcrypt.compare(password, team.password);
    if (!isMatch) return res.status(401).send('Invalid credentials');
    console.log(username,isMatch);
    const token = generateToken({ team: username });
    res.json({ token });
  } catch (err) {
    next(err);
  }
});

export default router;
