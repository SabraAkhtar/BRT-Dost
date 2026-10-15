const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema(
  {
    routeCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['Main Line', 'Express', 'Feeder'],
      default: 'Main Line'
    },
    description: {
      type: String,
      trim: true
    },
    startPoint: {
      type: String,
      required: true
    },
    endPoint: {
      type: String,
      required: true
    },
    color: {
      type: String,
      default: '#008170'
    },
    stations: [
      {
        name: { type: String, required: true },
        code: { type: String },
        order: { type: Number, default: 0 },
        isInterchange: { type: Boolean, default: false }
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    },
    schedule: {
      firstBus: { type: String, default: '06:00 AM' },
      lastBus: { type: String, default: '10:00 PM' },
      peakFrequency: { type: String, default: '3-5 mins' },
      offPeakFrequency: { type: String, default: '8-12 mins' }
    },
    isDemoData: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual aliases to support both startPoint/endPoint and startStation/endStation
routeSchema.virtual('startStation')
  .get(function () { return this.startPoint; })
  .set(function (v) { this.startPoint = v; });

routeSchema.virtual('endStation')
  .get(function () { return this.endPoint; })
  .set(function (v) { this.endPoint = v; });

routeSchema.index({ routeCode: 1, isActive: 1 });
routeSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Route', routeSchema);
