const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Alert title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    description: {
      type: String,
      required: [true, 'Alert description is required'],
      trim: true
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'disruption', 'closure'],
      default: 'info'
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: false
    },
    routeCode: {
      type: String,
      default: 'ALL',
      trim: true
    },
    routeName: {
      type: String,
      default: 'Entire BRT Network',
      trim: true
    },
    stationName: {
      type: String,
      default: 'Network-wide',
      trim: true
    },
    source: {
      type: String,
      required: [true, 'Source attribution is mandatory for transparency'],
      trim: true,
      default: 'BRT Dost Operations Desk'
    },
    sourceType: {
      type: String,
      enum: ['official_feed', 'admin_verified', 'passenger_verified', 'demo_sample'],
      default: 'admin_verified'
    },
    sourceDetails: {
      type: String,
      default: ''
    },
    verificationStatus: {
      type: String,
      enum: ['verified', 'unverified', 'official'],
      default: 'verified'
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'active', 'expired', 'withdrawn'],
      default: 'published'
    },
    publishedAt: {
      type: Date,
      default: Date.now
    },
    lastConfirmedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date
    },
    freshnessHours: {
      type: Number,
      default: 4, // Default freshness window in hours
      min: 1,
      max: 48
    },
    isDemoData: {
      type: Boolean,
      default: false
    },
    originReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      required: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // Audit: timestamp and actor recorded when alert is withdrawn
    withdrawnAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual alias 'message' pointing to description
alertSchema.virtual('message')
  .get(function () { return this.description; })
  .set(function (v) { this.description = v; });

alertSchema.index({ status: 1, lastConfirmedAt: -1 });
alertSchema.index({ routeCode: 1, stationName: 1 });

module.exports = mongoose.model('Alert', alertSchema);
