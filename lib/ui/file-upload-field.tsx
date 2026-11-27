import type { ComponentProps, ReactElement } from "react";
import type { FieldPathByValue, FieldValues } from "@handijitcom/forms";
import FileUpload from "@handijitcom/ui/file-upload";

import hasLeft from "./has-left";
import type { BinderProps } from "./ui.type";
import useBoundField from "./use-bound-field";

// One id per File object, for ui's list keys and removal. Weak, so a removed File is collected
// with its id; module-level, so render stays free of ref reads.
const FILE_IDS = /*#__PURE__*/ new WeakMap<File, string>();
let fileCount = 0;

const idOf = (file: File): string => {
  const known = FILE_IDS.get(file);
  if (known !== undefined) return known;
  fileCount += 1;
  const id = `file-${fileCount}`;
  FILE_IDS.set(file, id);
  return id;
};

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

  const files = Array.isArray(field.value) ? (field.value as File[]) : [];
  return (
    // ui's upload takes no id: the wrapper carries the field's id, so the form's focus and the
    // error summary's link reach the upload's first focusable part.
    <div
      id={field.id}
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
