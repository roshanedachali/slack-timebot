const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

const TIMEZONE_OFFSETS = {
  ET: -5,
  CT: -6,
  MT: -7,
  PT: -8
};

function parseTime(input) {
  const match = input.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)\s*(ET|CT|MT|PT)$/i);
  if (!match) return null;

  let [_, hour, minute, period, zone] = match;
  hour = parseInt(hour, 10);
  minute = parseInt(minute, 10);
  if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
  if (period.toUpperCase() === "AM" && hour === 12) hour = 0;

  return { hour, minute, baseZone: zone.toUpperCase() };
}

function formatTime(hour, minute) {
  const h = ((hour + 11) % 12) + 1;
  const ampm = hour >= 12 ? "PM" : "AM";
  return `${h}:${minute.toString().padStart(2, '0')} ${ampm}`;
}

app.post("/slack/command", (req, res) => {
  const text = req.body.text;
  const userName = req.body.user_name || "someone";
  const parsed = parseTime(text);

  if (!parsed) {
    return res.send("❌ Invalid input. Use format like `3:00 PM CT` or `10:30 AM PT`");
  }

  const { hour, minute, baseZone } = parsed;
  const baseOffset = TIMEZONE_OFFSETS[baseZone];

  const responses = Object.entries(TIMEZONE_OFFSETS)
    .map(([zone, offset]) => {
      const zoneHour = (hour + (offset - baseOffset) + 24) % 24;
      return `• ${zone}: *${formatTime(zoneHour, minute)}*`;
    })
    .join("\n");

  return res.json({
    response_type: "in_channel",
    text: `🕒 <@${userName}> proposed:\n\n${responses}`
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Simple timebot running.");
});