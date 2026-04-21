// load testing script to create accounts
import { check } from "k6";
import http from "k6/http";
import { Counter } from "k6/metrics";
const ACCESS_TOKEN = __ENV.ACCESS_TOKEN;
const BASE_URL = __ENV.BASE_URL;
if (!ACCESS_TOKEN || !BASE_URL) {
  throw new Error("Missing ACCESS_TOKEN or BASE_URL env var");
}

const status2xx = new Counter("status_2xx");
const status4xx = new Counter("status_4xx");
const status5xx = new Counter("status_5xx");

export default function () {
  const res = http.post(
    `${BASE_URL}/api/accounts/create`,
    JSON.stringify({ account_type: "checking" }),
    {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        "content-type": "application/json",
        pragma: "no-cache",
        priority: "u=1, i",
        "sec-ch-ua":
          '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Linux"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        cookie: `access_token=${ACCESS_TOKEN}`,
      },
    },
  );

  check(res, {
    success: (r) => r.status >= 200 && r.status < 300,
  });
  if (res.status >= 200 && res.status < 300) status2xx.add(1);
  else if (res.status >= 400 && res.status < 500) status4xx.add(1);
  else if (res.status >= 500) status5xx.add(1);
}
