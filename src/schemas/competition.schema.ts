import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, versionKey: false, collection: "competitions" })
export class Competition extends Document {
  @Prop({ type: String, required: true, unique: true })
  id: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: String, required: true })
  year: string;

  // نوع المسابقة: "quran" لحلقات القرآن — "edu" للمجموعات التربوية
  @Prop({ type: String, enum: ["quran", "edu"], default: "quran" })
  type: "quran" | "edu";

  // معرف المجموعة التربوية (لو النوع edu)
  @Prop({ type: String, default: null })
  edu_group_id?: string;

  @Prop({ type: Number, default: 100 })
  max_score: number;

  @Prop({ type: Boolean, default: false })
  results_published: boolean;
}

export const CompetitionSchema = SchemaFactory.createForClass(Competition);
