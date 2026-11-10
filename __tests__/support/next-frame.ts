import { act } from "@testing-library/react";

/** Lets the form's after-paint work (focusing the first error) run. */
export const nextFrame = async (): Promise<void> => {
  await act(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      })
  );
  await act(() => Promise.resolve());
};
