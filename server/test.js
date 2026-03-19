// k6 load test – run with: k6 run test.js (requires k6 CLI installed)
import http from "k6/http";
import { sleep } from "k6";

const BASE = "https://uchitkara.vercel.app";

export const options = {
  stages: [
    { duration: "20s", target: 20 },
    { duration: "1m", target: 150 },
    { duration: "2m", target: 300 },
    { duration: "1m", target: 500 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p95<5000"],
  },
};

export default function () {
  const urls = [`${BASE}/`, `${BASE}/hotornot`];
  const url = urls[Math.floor(Math.random() * urls.length)];
  http.get(url);
  sleep(0.5 + Math.random() * 1);
}
