import { CheckCircle2, ImageIcon, Upload } from "lucide-react";
import { type ChangeEvent, type DragEvent, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MediaUploadFieldProps {
  id: string;
  image: string;
  fileName: string;
  label?: string;
  description?: string;
  onSelect: (file: File) => void;
}

/** Shared image picker used by all public-content editors. */
export function MediaUploadField({
  id,
  image,
  fileName,
  label = "Archivo de imagen",
  description = "JPG, PNG o WebP. Recomendado: 1600 × 1000 px o superior.",
  onSelect,
}: MediaUploadFieldProps) {
  const [isDragging, setIsDragging] = useState(false);

  function selectFromInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onSelect(file);
  }

  function selectFromDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) onSelect(file);
  }

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={selectFromInput}
      />
      <label
        htmlFor={id}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={selectFromDrop}
        className={cn(
          "group flex cursor-pointer items-center gap-4 rounded-xl border border-dashed bg-muted/20 p-3 transition-colors",
          isDragging && "border-accent bg-accent/5",
        )}
      >
        <div className="size-20 shrink-0 overflow-hidden rounded-lg border bg-background">
          <img src={image} alt="Archivo seleccionado" className="size-full object-cover" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              <ImageIcon /> Imagen principal
            </Badge>
            <Badge variant="outline">
              <CheckCircle2 /> Lista para revisar
            </Badge>
          </div>
          <span className="truncate text-sm font-medium text-foreground">{fileName}</span>
          <span className="text-xs text-muted-foreground">
            Arrastra una imagen o selecciónala desde tu equipo.
          </span>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors group-hover:border-accent">
          <Upload /> Cambiar
        </span>
      </label>
      <FieldDescription>{description}</FieldDescription>
    </Field>
  );
}
