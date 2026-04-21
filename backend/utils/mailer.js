const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send facility booking confirmation email
 */
const sendBookingConfirmation = async ({
  to, userName, facilityName, facilityType,
  date, startTime, endTime, purpose
}) => {
  const transporter = createTransporter();

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const typeEmoji = { court: '🏀', field: '⚽', pool: '🏊', gym: '💪', track: '🏃', other: '🏟️' };
  const emoji = typeEmoji[facilityType] || '🏟️';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background:#f5f0eb; margin:0; padding:0; }
    .wrap { max-width:560px; margin:30px auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(30,58,138,.1); }
    .header { background:linear-gradient(135deg,#1e3a8a,#1d4ed8); padding:32px 32px 24px; text-align:center; }
    .header h1 { color:#fff; font-size:24px; margin:0; font-weight:800; letter-spacing:-0.5px; }
    .header p { color:#bfdbfe; font-size:13px; margin:6px 0 0; }
    .badge { display:inline-block; background:#22c55e; color:#fff; font-size:13px; font-weight:700; padding:6px 20px; border-radius:20px; margin:16px 0 0; }
    .body { padding:28px 32px; }
    .greeting { font-size:16px; color:#1e293b; margin-bottom:8px; }
    .greeting strong { color:#1e3a8a; }
    .sub { font-size:14px; color:#475569; margin-bottom:20px; }
    .detail-box { background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:20px 24px; margin:20px 0; }
    .detail-box h3 { color:#1e3a8a; font-size:14px; margin:0 0 16px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; }
    .row { display:flex; gap:12px; margin-bottom:12px; align-items:flex-start; }
    .row:last-child { margin-bottom:0; }
    .icon { font-size:18px; min-width:26px; margin-top:2px; }
    .label { font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:.05em; font-weight:600; margin-bottom:2px; }
    .value { font-size:14px; color:#1e293b; font-weight:600; }
    .note-box { background:#fff7ed; border-left:4px solid #f97316; border-radius:0 10px 10px 0; padding:14px 16px; margin:20px 0; }
    .note-box p { margin:0; font-size:13px; color:#9a3412; font-weight:600; }
    .closing { font-size:14px; color:#475569; line-height:1.6; }
    .footer { background:#f8fafc; border-top:1px solid #e2e8f0; padding:18px 32px; text-align:center; }
    .footer p { font-size:12px; color:#94a3b8; margin:3px 0; }
    .footer strong { color:#1e3a8a; }
  </style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>🏟️ SliitArena 360</h1>
    <p>SLIIT Sports Management System</p>
    <div class="badge">✅ Booking Confirmed</div>
  </div>
  <div class="body">
    <p class="greeting">Hello <strong>${userName}</strong>,</p>
    <p class="sub">Your <strong>${facilityName}</strong> reservation has been confirmed with the following details:</p>

    <div class="detail-box">
      <h3>${emoji} Booking Details</h3>
      <div class="row">
        <span class="icon">🏟️</span>
        <div><div class="label">Facility</div><div class="value">${facilityName}</div></div>
      </div>
      <div class="row">
        <span class="icon">📅</span>
        <div><div class="label">Date</div><div class="value">${formattedDate}</div></div>
      </div>
      <div class="row">
        <span class="icon">🕐</span>
        <div><div class="label">Start Time</div><div class="value">${startTime}</div></div>
      </div>
      <div class="row">
        <span class="icon">🕔</span>
        <div><div class="label">End Time</div><div class="value">${endTime}</div></div>
      </div>
      <div class="row">
        <span class="icon">📋</span>
        <div><div class="label">Purpose</div><div class="value">${purpose}</div></div>
      </div>
    </div>

    <div class="note-box">
      <p>⚠️ Please arrive on time. Your booking is valid only for the reserved slot. Vacate promptly after your session ends.</p>
    </div>

    <p class="closing">We look forward to seeing you! To cancel or manage your booking, visit the SliitArena 360 portal under <strong>Facilities → My Bookings</strong>.</p>
  </div>
  <div class="footer">
    <p>This is an automated message from <strong>SliitArena 360</strong></p>
    <p>SLIIT Sports Management System — Do not reply to this email</p>
  </div>
</div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"SliitArena 360" <${process.env.EMAIL_USER}>`,
    to,
    subject: `✅ Booking Confirmed — ${facilityName} on ${date}`,
    html,
  });
};

/**
 * Send low stock alert email to admin
 */
const sendLowStockAlert = async ({ equipmentName, availableQuantity, lowStockThreshold, category, location }) => {
  const transporter = createTransporter();
  const adminEmail = process.env.ADMIN_EMAIL;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background:#f5f0eb; margin:0; padding:0; }
    .wrap { max-width:560px; margin:30px auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(30,58,138,.1); }
    .header { background:linear-gradient(135deg,#b91c1c,#ef4444); padding:32px 32px 24px; text-align:center; }
    .header h1 { color:#fff; font-size:24px; margin:0; font-weight:800; letter-spacing:-0.5px; }
    .header p { color:#fecaca; font-size:13px; margin:6px 0 0; }
    .badge { display:inline-block; background:#fff; color:#b91c1c; font-size:13px; font-weight:700; padding:6px 20px; border-radius:20px; margin:16px 0 0; }
    .body { padding:28px 32px; }
    .alert-box { background:#fef2f2; border:1px solid #fecaca; border-radius:12px; padding:20px 24px; margin:20px 0; }
    .alert-box h3 { color:#b91c1c; font-size:14px; margin:0 0 16px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; }
    .row { display:flex; gap:12px; margin-bottom:12px; align-items:flex-start; }
    .row:last-child { margin-bottom:0; }
    .icon { font-size:18px; min-width:26px; margin-top:2px; }
    .label { font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:.05em; font-weight:600; margin-bottom:2px; }
    .value { font-size:14px; color:#1e293b; font-weight:600; }
    .value.danger { color:#b91c1c; font-size:18px; }
    .action-box { background:#fff7ed; border-left:4px solid #f97316; border-radius:0 10px 10px 0; padding:14px 16px; margin:20px 0; }
    .action-box p { margin:0; font-size:13px; color:#9a3412; font-weight:600; }
    .footer { background:#f8fafc; border-top:1px solid #e2e8f0; padding:18px 32px; text-align:center; }
    .footer p { font-size:12px; color:#94a3b8; margin:3px 0; }
    .footer strong { color:#1e3a8a; }
  </style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>🏟️ SliitArena 360</h1>
    <p>SLIIT Sports Management System</p>
    <div class="badge">⚠️ Low Stock Alert</div>
  </div>
  <div class="body">
    <p style="font-size:16px;color:#1e293b;margin-bottom:8px;">Hello <strong style="color:#b91c1c;">Admin</strong>,</p>
    <p style="font-size:14px;color:#475569;margin-bottom:20px;">The following equipment has dropped to or below the low stock threshold and requires your attention.</p>

    <div class="alert-box">
      <h3>📦 Equipment Details</h3>
      <div class="row">
        <span class="icon">🏷️</span>
        <div><div class="label">Equipment Name</div><div class="value">${equipmentName}</div></div>
      </div>
      <div class="row">
        <span class="icon">📂</span>
        <div><div class="label">Category</div><div class="value">${category}</div></div>
      </div>
      <div class="row">
        <span class="icon">📍</span>
        <div><div class="label">Location</div><div class="value">${location || 'Not specified'}</div></div>
      </div>
      <div class="row">
        <span class="icon">🔢</span>
        <div><div class="label">Available Quantity</div><div class="value danger">${availableQuantity}</div></div>
      </div>
      <div class="row">
        <span class="icon">⚠️</span>
        <div><div class="label">Low Stock Threshold</div><div class="value">${lowStockThreshold}</div></div>
      </div>
    </div>

    <div class="action-box">
      <p>🔔 Please restock this equipment as soon as possible to avoid disruptions to students and staff.</p>
    </div>

    <p style="font-size:14px;color:#475569;">Log in to the <strong>SliitArena 360</strong> portal and go to <strong>Equipment Management</strong> to update the stock.</p>
  </div>
  <div class="footer">
    <p>This is an automated alert from <strong>SliitArena 360</strong></p>
    <p>SLIIT Sports Management System — Do not reply to this email</p>
  </div>
</div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"SliitArena 360" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: `⚠️ Low Stock Alert — ${equipmentName} (${availableQuantity} remaining)`,
    html,
  });
};

module.exports = { sendBookingConfirmation, sendLowStockAlert };