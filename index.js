import express from "express";
import cors from "cors";
import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMembers],
});

const USERS = [
  { id: "1130322698438967307", name: "reo" },
  { id: "626404653139099648", name: "neo" },
];

client.once("ready", () => {
  console.log("🤖 Bot đã online");
});

app.get("/status", async (req, res) => {
  try {
    const guild = client.guilds.cache.first();
    if (!guild) return res.status(500).send("Bot chưa tham gia server nào.");

    const results = await Promise.all(
      USERS.map(async (user) => {
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) {
          return {
            id: user.id,
            name: user.name,
            avatar: null,
            status: "offline",
            activity: null,
          };
        }
        return {
          id: user.id,
          name: user.name,
          avatar: member.user.displayAvatarURL(),
          status: member.presence?.status || "offline",
          activity: member.presence?.activities?.[0]?.name || null,
        };
      })
    );

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).send("Lỗi server khi lấy trạng thái Discord.");
  }
});

app.get("/roblox-info/:userId", async (req, res) => {
  const userId = req.params.userId;
  const urlAvatar = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`;
  const urlPresence = `https://presence.roblox.com/v1/presence/users?userIds=${userId}`;

  try {
    const avatarRes = await fetch(urlAvatar);
    const avatarData = await avatarRes.json();

    const presenceRes = await fetch(urlPresence);
    const presenceData = await presenceRes.json();

    const avatarUrl =
      avatarData.data && avatarData.data.length > 0 ? avatarData.data[0].imageUrl : null;

    const userPresence =
      presenceData.userPresences && presenceData.userPresences.length > 0
        ? presenceData.userPresences[0]
        : null;

    let status = "Offline";
    if (userPresence) {
      status = userPresence.userPresenceType === 0 ? "Offline" : "Online";
    }

    res.json({
      avatarUrl,
      status,
    });
  } catch (error) {
    console.error("Lỗi lấy thông tin Roblox:", error);
    res.status(500).json({ error: "Lấy thông tin Roblox thất bại" });
  }
});

client.login(process.env.TOKEN);

app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});