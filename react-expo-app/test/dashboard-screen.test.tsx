import {
  render,
  screen,
} from "@testing-library/react-native";
import { DashboardView } from "@/features/dashboard/DashboardView";

test("dashboard shows spending and redirected totals", async () => {
  await render(
    <DashboardView
      currencyCode="USD"
      decisions={[]}
      isDemo
      monthlyGoal={300}
      name="Maya"
      onEditProfile={jest.fn()}
      onNewDecision={jest.fn()}
      onOpenDecisions={jest.fn()}
      onSignOut={jest.fn()}
    />,
  );

  expect(
    screen.getByText("Money redirected"),
  ).toBeTruthy();
  expect(
    screen.getByText("This month’s spending"),
  ).toBeTruthy();
  expect(
    screen.getByText("Check a purchase"),
  ).toBeTruthy();
  expect(screen.getByText("Demo mode")).toBeTruthy();
});
