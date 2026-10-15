const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    nameUrdu: {
      type: String,
      trim: true
    },
    connectedRoutes: [
      {
        type: String,
        trim: true
      }
    ],
    isInterchange: {
      type: Boolean,
      default: false
    },
    facilities: [
      {
        type: String,
        trim: true
      }
    ],
    locationSummary: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

stationSchema.virtual('associatedRoutes')
  .get(function () { return this.connectedRoutes; })
  .set(function (v) { this.connectedRoutes = v; });

stationSchema.index({ name: 'text', locationSummary: 'text' });

module.exports = mongoose.model('Station', stationSchema);
