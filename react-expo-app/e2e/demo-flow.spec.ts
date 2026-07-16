import path from "node:path";
import {
  expect,
  test,
  type Page,
} from "@playwright/test";

const assetsDirectory = path.resolve(
  process.cwd(),
  "../docs/assets",
);

async function captureReadmeScreenshot(
  page: Page,
  filename: string,
) {
  if (
    process.env.UPDATE_README_SCREENSHOTS !== "1"
  ) {
    return;
  }
  await page.screenshot({
    path: path.join(assetsDirectory, filename),
    type: "jpeg",
    quality: 88,
    fullPage: true,
  });
}

function captureBrowserErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    errors.push(error.message);
  });
  return errors;
}

async function enterDemo(page: Page) {
  await page.goto("/");
  await expect(
    page.getByText(
      "Make spending decisions on purpose.",
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Explore demo" })
    .click();
  await expect(
    page.getByText(
      "Personalize your NudgeFund workspace.",
    ),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Save preferences",
    })
    .click();
  await expect(
    page.getByText("Money redirected"),
  ).toBeVisible();
}

test("demo mode completes the full product story", async ({
  page,
}) => {
  const browserErrors = captureBrowserErrors(page);
  await page.setViewportSize({
    width: 1440,
    height: 1000,
  });

  await page.goto("/");
  await expect(
    page.getByText(
      "Make spending decisions on purpose.",
    ),
  ).toBeVisible();
  await captureReadmeScreenshot(
    page,
    "nudgefund-login.jpg",
  );

  await page
    .getByRole("button", { name: "Explore demo" })
    .click();
  await page
    .getByRole("button", {
      name: "Save preferences",
    })
    .click();
  await page
    .getByRole("button", {
      name: "Check a purchase",
    })
    .click();

  await page
    .getByPlaceholder(
      "What are you considering?",
    )
    .fill("Headphones");
  await page
    .getByPlaceholder("0.00")
    .fill("250");
  await page
    .getByRole("button", { name: "Shopping" })
    .click();
  await page
    .getByRole("button", { name: "Continue" })
    .click();

  const answers = page.getByPlaceholder(
    "Write your answer",
  );
  await answers.nth(0).fill("It is not urgent.");
  await answers
    .nth(1)
    .fill("I already own a working pair.");
  await answers
    .nth(2)
    .fill("I would use savings.");
  await page
    .getByRole("button", {
      name: "Review my answers",
    })
    .click();

  await expect(
    page.getByText(
      "A pause may serve you better.",
    ),
  ).toBeVisible();
  await captureReadmeScreenshot(
    page,
    "nudgefund-purchase-check.jpg",
  );

  await page
    .getByRole("button", {
      name: "Record final decision",
    })
    .click();
  await page
    .getByLabel("Final amount")
    .fill("150");
  await page
    .getByRole("button", {
      name: "Save decision",
    })
    .click();

  await expect(
    page.getByText("Headphones").first(),
  ).toBeVisible();
  await expect(
    page.getByText("$100.00").first(),
  ).toBeVisible();

  await page
    .getByRole("tab", { name: "Overview dashboard" })
    .click();
  await expect(
    page.getByText("Money redirected"),
  ).toBeVisible();
  await captureReadmeScreenshot(
    page,
    "nudgefund-dashboard.jpg",
  );

  await page
    .getByRole("tab", { name: "Growth" })
    .click();
  await expect(
    page.getByText(
      /Hypothetical value in 10 years/,
    ),
  ).toBeVisible();

  await page
    .getByRole("tab", { name: "Reports" })
    .click();
  await expect(
    page.getByText("Monthly reflection"),
  ).toBeVisible();
  await expect(
    page.getByText(/educational information/i),
  ).toBeVisible();

  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        window.innerWidth,
    ),
  ).toBe(true);
  expect(browserErrors).toEqual([]);
});

test("demo onboarding fits a 390px phone viewport", async ({
  page,
}) => {
  const browserErrors = captureBrowserErrors(page);
  await page.setViewportSize({
    width: 390,
    height: 844,
  });
  await enterDemo(page);

  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        window.innerWidth,
    ),
  ).toBe(true);
  expect(browserErrors).toEqual([]);
});

test("demo dashboard fits dark landscape mode", async ({
  page,
}) => {
  const browserErrors = captureBrowserErrors(page);
  await page.emulateMedia({
    colorScheme: "dark",
    reducedMotion: "reduce",
  });
  await page.setViewportSize({
    width: 844,
    height: 390,
  });
  await enterDemo(page);

  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        window.innerWidth,
    ),
  ).toBe(true);
  expect(browserErrors).toEqual([]);
});
