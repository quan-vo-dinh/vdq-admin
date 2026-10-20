import "server-only";
import { createFeedService } from "./service";
export const getDailyFeed = createFeedService({
  token: () => process.env.DAILY_DEV_TOKEN,
});
