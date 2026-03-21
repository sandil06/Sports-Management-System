const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Facility = require('./models/Facility');
const Equipment = require('./models/Equipment');
const Tournament = require('./models/Tournament');
const Sponsor = require('./models/Sponsor');
const connectDB = require('./config/db');

const seed = async () => {
  await connectDB();

  await User.deleteMany();
  await Facility.deleteMany();
  await Equipment.deleteMany();
  await Tournament.deleteMany();
  await Sponsor.deleteMany();

  const admin = await User.create({ name: 'Admin User', email: 'admin@sliit.lk', password: 'admin123', studentId: 'ADMIN001', role: 'admin' });
  const coach = await User.create({ name: 'Coach Silva', email: 'coach@sliit.lk', password: 'coach123', studentId: 'COACH001', role: 'coach' });
  await User.create({ name: 'Jayasooriya S R', email: 'student@sliit.lk', password: 'student123', studentId: 'IT23849006', role: 'student', department: 'Faculty of IT' });

  const sponsor1 = await Sponsor.create({ name: 'Kasun Perera', company: 'SportZone LK', email: 'sponsor@sportzone.lk', password: 'sponsor123', phone: '0771234567', totalContribution: 0 });

  await Facility.insertMany([
    { name: 'Basketball Court A', type: 'court', sport: 'Basketball', capacity: 20, amenities: ['Lighting', 'Scoreboard'], location: 'Block A' },
    { name: 'Football Field', type: 'field', sport: 'Football', capacity: 50, amenities: ['Floodlights'], location: 'Outdoor' },
    { name: 'Swimming Pool', type: 'pool', sport: 'Swimming', capacity: 30, amenities: ['Changing Rooms'], location: 'Sports Complex' },
    { name: 'Badminton Court 1', type: 'court', sport: 'Badminton', capacity: 8, amenities: ['Lighting'], location: 'Block B' },
    { name: 'Gymnasium', type: 'gym', sport: 'Fitness', capacity: 40, amenities: ['AC', 'Weights'], location: 'Block C' },
  ]);

  await Equipment.insertMany([
    { name: 'Cricket Bat', category: 'Cricket', totalQuantity: 10, availableQuantity: 8, condition: 'good' },
    { name: 'Basketball', category: 'Ball Sports', totalQuantity: 15, availableQuantity: 12, condition: 'good' },
    { name: 'Badminton Racket', category: 'Racket Sports', totalQuantity: 20, availableQuantity: 2, condition: 'fair', lowStockThreshold: 4 },
    { name: 'Football', category: 'Ball Sports', totalQuantity: 10, availableQuantity: 8, condition: 'good' },
    { name: 'Volleyball', category: 'Ball Sports', totalQuantity: 8, availableQuantity: 6, condition: 'excellent' },
    { name: 'Chess Set', category: 'Chess', totalQuantity: 12, availableQuantity: 10, condition: 'good' },
    { name: 'Tennis Racket', category: 'Racket Sports', totalQuantity: 12, availableQuantity: 1, condition: 'fair', lowStockThreshold: 3 },
    { name: 'Rugby Ball', category: 'Rugby', totalQuantity: 6, availableQuantity: 5, condition: 'good' },
  ]);

  await Tournament.insertMany([
    { name: 'Inter-Faculty Cricket Championship 2025', sport: 'Cricket', type: 'team', description: 'Annual cricket tournament', startDate: new Date('2025-04-10'), endDate: new Date('2025-04-15'), registrationDeadline: new Date('2025-04-05'), venue: 'Main Cricket Ground', maxParticipants: 8, requiredTeamSize: 11, status: 'upcoming', createdBy: admin._id, prize: 'LKR 50,000' },
    { name: 'Basketball League 2025', sport: 'Basketball', type: 'team', description: 'University basketball league', startDate: new Date('2025-05-01'), endDate: new Date('2025-05-10'), registrationDeadline: new Date('2025-04-25'), venue: 'Basketball Court A', maxParticipants: 8, requiredTeamSize: 5, status: 'upcoming', createdBy: admin._id, prize: 'LKR 30,000' },
    { name: 'Swimming Championship 2025', sport: 'Swimming', type: 'individual', description: 'Individual swimming competition', startDate: new Date('2025-05-20'), endDate: new Date('2025-05-22'), registrationDeadline: new Date('2025-05-15'), venue: 'Swimming Pool', maxParticipants: 50, requiredTeamSize: 1, status: 'upcoming', createdBy: coach._id },
    { name: 'Chess Tournament 2025', sport: 'Chess', type: 'individual', description: 'University chess championship', startDate: new Date('2025-06-01'), endDate: new Date('2025-06-02'), registrationDeadline: new Date('2025-05-28'), venue: 'IT Building - Room 301', maxParticipants: 32, requiredTeamSize: 1, status: 'upcoming', createdBy: admin._id },
    { name: 'Badminton Doubles 2025', sport: 'Badminton', type: 'team', description: 'Doubles badminton tournament', startDate: new Date('2025-06-15'), endDate: new Date('2025-06-17'), registrationDeadline: new Date('2025-06-10'), venue: 'Badminton Court 1', maxParticipants: 16, requiredTeamSize: 2, status: 'upcoming', createdBy: coach._id },
  ]);

  console.log('\n✅ SliitArena 360 seed data inserted!');
  console.log('─────────────────────────────────────');
  console.log('Admin:   admin@sliit.lk   / admin123');
  console.log('Coach:   coach@sliit.lk   / coach123');
  console.log('Student: student@sliit.lk / student123');
  console.log('Sponsor: sponsor@sportzone.lk / sponsor123');
  console.log('─────────────────────────────────────');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
