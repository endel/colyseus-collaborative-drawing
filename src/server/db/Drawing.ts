import mongoose, { Document, Schema } from 'mongoose';

export interface IDrawing extends Document {
  paths: Array<{brush: string, color: number, points: number[]}>;
  userIds: string[],
  usersCount: number,
  mode: string,
  votes: number,
}

const PathSchema = new mongoose.Schema({
  brush: String,
  color: Number,
  points: [Number]
}, {
  _id: false
});

const Drawing: Schema = new Schema<IDrawing>({
  paths: [PathSchema],
  userIds: [String],
  usersCount: Number,
  mode: String,
  votes: Number,
}, {
  timestamps: true,
  versionKey: false,
});

export default mongoose.model<IDrawing>('Drawing', Drawing);
