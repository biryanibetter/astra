import handler from "vinext/server/fetch-handler";
import { websiteOnlyResponse } from "./website-only";

export default {
  fetch(
    ...args: Parameters<typeof handler.fetch>
  ): ReturnType<typeof handler.fetch> {
    const [request] = args;
    const blocked = websiteOnlyResponse(request);
    if (blocked) return Promise.resolve(blocked);
    return handler.fetch(...args);
  },
};
