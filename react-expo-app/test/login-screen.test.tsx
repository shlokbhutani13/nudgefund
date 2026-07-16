import {
  render,
  screen,
} from "@testing-library/react-native";
import { LoginView } from "@/features/auth/LoginView";

test("login offers connected and demo entry", async () => {
  await render(
    <LoginView
      connectedModeAvailable
      onDemo={jest.fn()}
      onResetPassword={jest
        .fn()
        .mockResolvedValue({})}
      onSignIn={jest.fn().mockResolvedValue({})}
      onSignUp={jest.fn()}
    />,
  );

  expect(
    screen.getByText(
      "Make spending decisions on purpose.",
    ),
  ).toBeTruthy();
  expect(screen.getByText("Sign in")).toBeTruthy();
  expect(
    screen.getByText("Explore demo"),
  ).toBeTruthy();
  expect(
    screen.getByLabelText("Email address"),
  ).toBeTruthy();
});
