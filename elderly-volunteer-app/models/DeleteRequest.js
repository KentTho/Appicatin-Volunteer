const mongoose = require("mongoose");

const deleteRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  reason: { type: String, default: null },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
  processedAt: { type: Date, default: null },
});
const DeleteRequest = mongoose.model("deleteRequests", deleteRequestSchema);
module.exports = DeleteRequest;
