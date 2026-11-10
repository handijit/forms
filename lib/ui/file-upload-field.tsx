import { useRef, type ComponentProps, type ReactElement } from "react";
import {
  useRegisterField,
  type FieldPathByValue,
  type FieldValues,
} from "@handijit/forms";
import FileUpload from "@handijit/ui/file-upload";

import hasLeft from "./has-left";
import type { BinderProps } from "./ui.type";
import useBoundField from "./use-bound-field";

type FilesPath<TValues> = FieldPathByValue<
  TValues,
  readonly File[] | null | undefined
>;

export type FileUploadFieldProps<
  TValues = FieldValues,
  P extends FilesPath<TValues> = FilesPath<TValues>,
> = BinderProps<TValues, P> &
  Omit<
    ComponentProps<typeof FileUpload>,
    "files" | "onSelect" | "onRemove" | "error"
  >;

/**
 * ui's `FileUpload` bound to a `File[]` field. The upload draws its own label, hint and error;
 * selecting adds files (`isMultiple`) or replaces the one file.
 */
const FileUploadField = <
  TValues = FieldValues,
  P extends FilesPath<TValues> = FilesPath<TValues>,
>({
  name,
  form,
  validate,
  label,
  isDisabled,
  isMultiple = false,
  ...uploadProps
}: FileUploadFieldProps<TValues, P>): ReactElement => {
  const bound = useBoundField(form as never, name, {
    label,
    validate: validate as never,
  });
  const { field } = bound;
  const container = useRef<HTMLDivElement>(null);
  useRegisterField(bound.form, name as never, {
    getElement: () => container.current,
  });

  // A stable id per File object, for ui's list keys and removal.
  const ids = useRef(new WeakMap<File, string>());
  const count = useRef(0);
  const idOf = (file: File): string => {
    const known = ids.current.get(file);
    if (known !== undefined) return known;
    count.current += 1;
    const id = `file-${count.current}`;
    ids.current.set(file, id);
    return id;
  };

  const files = Array.isArray(field.value) ? (field.value as File[]) : [];
  return (
    <div
      ref={container}
      onBlur={(event) => {
        if (hasLeft(event)) field.onBlur();
      }}
    >
      <FileUpload
        {...uploadProps}
        label={label}
        isMultiple={isMultiple}
        files={files.map((file) => ({
          id: idOf(file),
          name: file.name,
          size: file.size,
        }))}
        onSelect={(selected) =>
          field.setValue(
            isMultiple ? [...files, ...selected] : selected.slice(0, 1)
          )
        }
        onRemove={(id) =>
          field.setValue(files.filter((file) => idOf(file) !== id))
        }
        {...(field.error === undefined ? {} : { error: field.error })}
        isDisabled={isDisabled ?? (bound.isDisabled || bound.isReadOnly)}
      />
    </div>
  );
};

export default FileUploadField;
