import mongoose from 'mongoose';

/**
 * Defines the schema for the Team model.
 *
 * @returns {Schema} - The Mongoose schema for the Team model.
 */
const TeamSchema = new mongoose.Schema({
  username:     { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

/**
 * Exports the Team model based on the defined schema.
 *
 * @returns {Model} - The Mongoose model for the Team collection.
 */
export default mongoose.model('Team', TeamSchema);
