import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react-native";
import { createDeterministicCoach } from "@/features/coaching/deterministicCoach";
import { PurchaseWizard } from "@/features/decisions/PurchaseWizard";

test("purchase wizard advances from details to coaching questions", async () => {
  await render(
    <PurchaseWizard
      coach={createDeterministicCoach()}
      onCancel={jest.fn()}
      onComplete={jest.fn()}
    />,
  );

  await fireEvent.changeText(
    screen.getByPlaceholderText(
      "What are you considering?",
    ),
    "Headphones",
  );
  await fireEvent.changeText(
    screen.getByPlaceholderText("0.00"),
    "250",
  );
  await fireEvent.press(
    screen.getByText("Shopping"),
  );
  await fireEvent.press(
    screen.getByText("Continue"),
  );

  expect(
    await screen.findByText(
      /What problem would Headphones solve/,
    ),
  ).toBeTruthy();
  expect(
    screen.getByText("Step 2 of 4"),
  ).toBeTruthy();
});

test("purchase wizard saves one completed decision", async () => {
  const onComplete = jest
    .fn()
    .mockResolvedValue(undefined);
  await render(
    <PurchaseWizard
      coach={createDeterministicCoach()}
      onCancel={jest.fn()}
      onComplete={onComplete}
    />,
  );

  await fireEvent.changeText(
    screen.getByPlaceholderText(
      "What are you considering?",
    ),
    "Headphones",
  );
  await fireEvent.changeText(
    screen.getByPlaceholderText("0.00"),
    "250",
  );
  await fireEvent.press(
    screen.getByText("Shopping"),
  );
  await fireEvent.press(
    screen.getByText("Continue"),
  );

  const answerFields =
    await screen.findAllByPlaceholderText(
      "Write your answer",
    );
  await fireEvent.changeText(
    answerFields[0],
    "It is not urgent",
  );
  await fireEvent.changeText(
    answerFields[1],
    "I already own a pair",
  );
  await fireEvent.changeText(
    answerFields[2],
    "I would use savings",
  );
  await fireEvent.press(
    screen.getByText("Review my answers"),
  );
  await fireEvent.press(
    await screen.findByText("Record final decision"),
  );
  await fireEvent.changeText(
    screen.getByLabelText("Final amount"),
    "150",
  );
  await fireEvent.press(
    screen.getByText("Save decision"),
  );

  expect(onComplete).toHaveBeenCalledTimes(1);
  expect(onComplete).toHaveBeenCalledWith(
    expect.objectContaining({
      itemName: "Headphones",
      finalAmount: 150,
      amountRedirected: 100,
      verdict: "negative",
    }),
  );
});
