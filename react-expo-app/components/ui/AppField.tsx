import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import {
  radius,
  spacing,
  type,
  useAppTheme,
} from "@/constants/theme";

export function AppField({
  error,
  helper,
  label,
  ...inputProps
}: TextInputProps & {
  error?: string;
  helper?: string;
  label: string;
}) {
  const palette = useAppTheme();

  return (
    <View style={styles.field}>
      <Text
        style={[
          styles.label,
          { color: palette.ink },
        ]}
      >
        {label}
      </Text>
      <TextInput
        accessibilityLabel={
          inputProps.accessibilityLabel ?? label
        }
        placeholderTextColor={palette.inkMuted}
        selectionColor={palette.mint}
        style={[
          styles.input,
          {
            backgroundColor: palette.surface,
            borderColor: error
              ? palette.risk
              : palette.line,
            color: palette.ink,
          },
          inputProps.multiline
            ? styles.multiline
            : null,
          inputProps.style,
        ]}
        {...inputProps}
      />
      {error ? (
        <Text
          accessibilityRole="alert"
          style={[
            styles.supporting,
            { color: palette.risk },
          ]}
        >
          {error}
        </Text>
      ) : helper ? (
        <Text
          style={[
            styles.supporting,
            { color: palette.inkMuted },
          ]}
        >
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  label: {
    ...type.caption,
    fontWeight: "700",
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    ...type.body,
  },
  multiline: {
    minHeight: 112,
    paddingTop: spacing.md,
    textAlignVertical: "top",
  },
  supporting: {
    ...type.caption,
  },
});
