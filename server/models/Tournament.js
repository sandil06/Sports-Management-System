const mongoose = require('mongoose');

const sportTeamSizes = {
  'Cricket': 11, 'Basketball': 5, 'Volleyball': 6, 'Football': 11,
  'Rugby': 15, 'Hockey': 11, 'Netball': 7, 'Table Tennis': 2,
  'Badminton': 2, 'Tennis': 2, 'Chess': 1, 'Carrom': 2,
  'Swimming': 1, 'Track & Field': 1
};

const individualSports = ['Chess', 'Swimming', 'Track & Field'];

const tournamentSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Tournament name is required'] },
  sport: {
    type: String,
    required: [true, 'Sport is required'],
    enum: Object.keys(sportTeamSizes)
  },
  type: {
    type: String,
    enum: ['individual', 'team'],
    default: function() {
      return individualSports.includes(this.sport) ? 'individual' : 'team';
    }
  },
  description: { type: String },
  startDate: { type: Date, required: [true, 'Start date is required'] },
  endDate: { type: Date, required: [true, 'End date is required'] },
  registrationDeadline: { type: Date, required: [true, 'Registration deadline is required'] },
  venue: { type: String, required: [true, 'Venue is required'] },
  maxParticipants: { type: Number, required: [true, 'Max participants required'], min: 1 },
  currentParticipants: { type: Number, default: 0 },
  requiredTeamSize: {
    type: Number,
    default: function() { return sportTeamSizes[this.sport] || 1; }
  },
  status: { type: String, enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], default: 'upcoming' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sponsors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Sponsor' }],
  results: { type: String },
  prize: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Tournament', tournamentSchema);
module.exports.sportTeamSizes = sportTeamSizes;
module.exports.individualSports = individualSports;
