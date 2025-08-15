const express = require("express");
const bodyParser = require("body-parser");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/slack/command", (req, res) => {
  const text = req.body.text;
  const userName = req.body.user_name;

  const dt = dayjs.tz(text, "dddd h:mma z", "America/Chicago");
  if (!dt.isValid()) {
    return res.send("❌ Couldn't understand that time. Try something like: Friday 3pm CST");
  }

  const utcTime = dt.utc().format();
  const viewerUrl = `https://yourtimeapp.vercel.app?t=${encodeURIComponent(utcTime)}`;

  res.json({
    response_type: "in_channel",
    text: `🕒 <@${userName}> proposed: *${dt.format("dddd, h:mm A z")}*\n👉 <${viewerUrl}|See in your local time>`,
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Slack bot running.");
});
