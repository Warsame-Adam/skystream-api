import { Schema, model } from "mongoose";

const rolesSchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, "A Role must have a name"],
    },
  },
  {
    timestamps: true,
    collection: "ROLES",
  }
);
export default model("Roles", rolesSchema);
