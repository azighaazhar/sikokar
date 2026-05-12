const { loadEnv } = require("./config/env");
loadEnv();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const routes = require("./routes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

if (process.env.TRUST_PROXY === "1") {
  app.set("trust proxy", 1);
}

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
const max = Number(process.env.RATE_LIMIT_MAX || 120);
const limiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(cors());
app.use(helmet());
app.use(limiter);
app.use(express.json());

app.use(routes);
app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API running on port ${port}`);
});
