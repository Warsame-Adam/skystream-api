import { Schema, model } from "mongoose";
const validator = require("validator");
const bcrypt = require("bcryptjs");
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "A User must have an email"],
      unique: [true, "Email already exist"],
      lowercase: true,
      validate: [validator.isEmail, "Please Provide a Valid Email"],
    },
    password: {
      type: String,
      required: [true, "A User must have a Password"],
      select: false,
      min: [6, "User password must be 5 characters or long"],
      //at least 8 characters, one upper case letter, one lower case letter and one symbol or special character. And it also contains no spaces, tabs or line breaks.
      // validate: {
      //   validator: function (v) {
      //     return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*]).{8,}$/.test(v);
      //   },
      //   message:
      //     'Password must contain at least 8 characters, one upper case letter, one special character and one number.',
      // },
    },
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ROLES",
        // validate: {
        //   validator: async function (v) {
        //     return await Roles.findById(v, (err, rec) => rec !== null);
        //   },
        //   message: 'Invalid Object ID',
        // },
        required: true,
      },
    ],
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    collection: "USERS", // Explicitly set the collection name
  }
);

userSchema.pre("save", async function (next) {
  //hashing password
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

export default model("User", userSchema);
