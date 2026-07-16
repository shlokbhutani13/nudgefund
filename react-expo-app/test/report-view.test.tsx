import {
  render,
  screen,
} from "@testing-library/react-native";
import { MonthlyReportView } from "@/features/reports/MonthlyReportView";

test("report explains that coaching is educational", async () => {
  await render(
    <MonthlyReportView
      currencyCode="USD"
      decisions={[]}
      insight={{
        text: "Start with one purchase check.",
        mode: "demo",
      }}
    />,
  );

  expect(
    screen.getByText(/educational information/i),
  ).toBeTruthy();
  expect(
    screen.getByText(
      "Start with one purchase check.",
    ),
  ).toBeTruthy();
  expect(
    screen.getByText("Demo insight"),
  ).toBeTruthy();
});
