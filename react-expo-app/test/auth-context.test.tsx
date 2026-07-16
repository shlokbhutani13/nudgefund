import { fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";
import { AuthProvider, useAuth } from "@/lib/AuthContext";

function Probe() {
  const auth = useAuth();
  return (
    <>
      <Text testID="mode">{auth.mode}</Text>
      <Text onPress={auth.enterDemo}>Enter demo</Text>
      <Text onPress={auth.exitDemo}>Exit demo</Text>
    </>
  );
}

test("users can enter and exit demo mode without Supabase", async () => {
  const view = await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

  await fireEvent.press(view.getByText("Enter demo"));
  expect(view.getByTestId("mode").props.children).toBe("demo");

  await fireEvent.press(view.getByText("Exit demo"));
  expect(view.getByTestId("mode").props.children).toBe("signed-out");
});
