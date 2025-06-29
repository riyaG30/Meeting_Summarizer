import mongoose from 'mongoose';

/**
 * Defines the schema for the Item model.
 *
 * @returns {Schema} - The Mongoose schema for the Item model.
 */
const ItemSchema = new mongoose.Schema({
  user:             { type: String, required: true },
  completed_tasks:  { type: String, default: "" },
  todo_tasks:       { type: String, default: "" },
  blockers:         { type: String, default: "" }
}, { _id: false });

/**
 * Defines the schema for the Summary model.
 *
 * @returns {Schema} - The Mongoose schema for the Summary model.
 */
const SummarySchema = new mongoose.Schema({
  team:  { type: String, required: true },
  date:  { type: String, required: true },  // YYYY-MM-DD
  items: { type: [ItemSchema], default: [] }
});

/**
 * Creates a unique index on the 'team' and 'date' fields of the Summary model.
 */
SummarySchema.index({ team: 1, date: 1 }, { unique: true });

/**
 * Exports the Summary model based on the defined schema.
 *
 * @returns {Model} - The Mongoose model for the Summary collection.
 */
export default mongoose.model('Summary', SummarySchema);
