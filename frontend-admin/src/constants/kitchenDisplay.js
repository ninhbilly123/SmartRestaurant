export const KITCHEN_SOCKET_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const KITCHEN_NOTIFICATION_SOUND =
  "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleJlvwY+nMx8LP5jW3LJ5dGm9iqQvHwk/l9XXtnl1Z7iNpTIgCD+Y1di5e3Zlt4+mNSIIP5rV2Lx8d2S1kafxIwg/m9TYvn15ZLOTqPYkCT+c1NjAfnplsZWp+SUJP57U2MJ/e2WvlqryJgk/n9TYw4B8ZayXq+0nCT+g1NjEgX1lq5ir6CgJP6HU2MWCfmWomKzjKQk/otTYxoN/ZaaZrd4qCT+j1NjHhIBmpaub2SsJP6TU2MiFgGajq53ULAk/pdTYyYaBZqKsnc8tCT+m1NjKh4Jmoa2eyi4JP6fU2MuIg2afsJ7FMAI/qNTYzImDZp6xnsEzAj+p1NjNioRmKevjQCP6rU2M6KhGadsZ67NgI/q9TYz4uFZpy0nrg3Aj+s1NjQi4Vmm7WesTkCP63U2NGMhmabtp6tOgI/rtTY0o2GZpq3nqk8Aj+v1NjTjYdmmbiepj0CP7DU2NSNh2aZuZ6iQAI/sdTY1Y6IZpi6np5BAj+y1NjWj4lml7yelkMCP7PU2NeQiWaXvJ6SRAJAstXX2JCKZpa9npBFAkCz1dfZkYtmr8GdjkYCQH/M0tqXk26jy5yISQJAbr/H3J+edoTD1INQAkBbutfbnqBs";

export const WARNING_TIME = 10;
export const OVERDUE_TIME = 20;

export const KITCHEN_VISIBLE_STATUSES = ["confirmed", "preparing", "ready"];
export const KITCHEN_HIDDEN_STATUSES = [
  "completed",
  "cancelled",
  "pending",
  "served",
  "payment_request",
  "payment_pending",
];
