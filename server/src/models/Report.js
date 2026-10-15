const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: false
    },
    routeCode: {
      type: String,
      required: true,
      trim: true
    },
    routeName: {
      type: String,
      required: true,
      trim: true
    },
    stationName: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Delay',
        'Overcrowding',
        'AC / Climate Control',
        'Safety & Security',
        'Ticketing / Zu Card',
        'Station Infrastructure',
        'Bus Breakdown',
        'Other'
      ]
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    // Optional contact info - Strictly excluded from public responses
    passengerContact: {
      type: String,
      trim: true,
      default: ''
    },
    moderationStatus: {
      type: String,
      enum: ['pending', 'under review', 'under_review', 'verified', 'rejected', 'conflict_flagged'],
      default: 'pending'
    },
    moderationNotes: {
      type: String,
      trim: true,
      default: ''
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    },
    isConflict: {
      type: Boolean,
      default: false
    },
    conflictReason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Method to format for safe public view (strips contact and private moderation notes)
reportSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    routeCode: this.routeCode,
    routeName: this.routeName,
    stationName: this.stationName,
    category: this.category,
    description: this.description,
    moderationStatus: this.moderationStatus,
    isConflict: this.isConflict,
    createdAt: this.createdAt,
    verificationLabel: this.moderationStatus === 'verified' ? 'Verified Passenger Report' : 'Unverified Passenger Report'
  };
};

reportSchema.index({ moderationStatus: 1, createdAt: -1 });
reportSchema.index({ routeCode: 1, stationName: 1 });

module.exports = mongoose.model('Report', reportSchema);
