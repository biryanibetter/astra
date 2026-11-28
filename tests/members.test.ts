import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { Members } from "@/components/home/members";

it("publishes only the supplied roster and restores announcement mode with the same grid", () => {
  const roster = [
    { name: "Sample Member", role: "Sample Role", photo: "/icon.png" },
  ];
  const render = (mode: "announcement" | "published") =>
    new DOMParser().parseFromString(
      renderToStaticMarkup(createElement(Members, { mode, roster })),
      "text/html",
    );

  const published = render("published");
  expect(published.querySelector(".member-announcement")).toBeNull();
  expect(published.querySelectorAll(".member-grid")).toHaveLength(1);
  expect(published.querySelectorAll(".member-card")).toHaveLength(20);
  const firstCard = published.querySelector(".member-card");
  expect(firstCard?.querySelector("img")?.getAttribute("src")).toContain(
    "%2Ficon.png",
  );
  expect(firstCard?.textContent).toContain("Sample Member");
  expect(firstCard?.textContent).toContain("Sample Role");

  const announcement = render("announcement");
  expect(announcement.querySelectorAll(".member-grid")).toHaveLength(1);
  expect(announcement.querySelectorAll(".member-card")).toHaveLength(20);
  expect(
    announcement.querySelector(".member-grid")?.closest("[inert]"),
  ).not.toBeNull();
  expect(announcement.body.textContent).not.toContain("Sample Member");
  expect(announcement.querySelector(".member-grid img")).toBeNull();
});
