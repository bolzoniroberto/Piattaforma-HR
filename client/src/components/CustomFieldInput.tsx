import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomFieldDefinition } from "@shared/schema";

interface CustomFieldInputProps {
  field: CustomFieldDefinition;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function CustomFieldInput({ field, value, onChange, disabled = false }: CustomFieldInputProps) {
  const renderInput = () => {
    switch (field.fieldType) {
      case "text":
      case "email":
      case "phone":
      case "url":
        return (
          <Input
            type={field.fieldType === "email" ? "email" : field.fieldType === "phone" ? "tel" : field.fieldType === "url" ? "url" : "text"}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ""}
            disabled={disabled}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ""}
            disabled={disabled}
          />
        );

      case "date":
        return (
          <Input
            type="date"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        );

      case "textarea":
        return (
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ""}
            disabled={disabled}
            rows={3}
          />
        );

      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={value === "true"}
              onCheckedChange={(checked) => onChange(checked ? "true" : "false")}
              disabled={disabled}
            />
            <Label className="text-sm text-muted-foreground">
              {value === "true" ? "Sì" : "No"}
            </Label>
          </div>
        );

      case "select":
        const options = field.options as Array<{ value: string; label: string }> | null;
        return (
          <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Seleziona..."} />
            </SelectTrigger>
            <SelectContent>
              {options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "multiselect":
        // For multiselect, we store as comma-separated values
        const multiselectOptions = field.options as Array<{ value: string; label: string }> | null;
        const selectedValues = value ? value.split(",") : [];

        return (
          <div className="space-y-2">
            {multiselectOptions?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`${field.id}-${option.value}`}
                  checked={selectedValues.includes(option.value)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter((v) => v !== option.value);
                    onChange(newValues.join(","));
                  }}
                  disabled={disabled}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor={`${field.id}-${option.value}`} className="text-sm font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <Input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={field.id}>
          {field.fieldLabel}
          {field.isRequired && <span className="text-destructive ml-1">*</span>}
        </Label>
      </div>
      {renderInput()}
      {field.helpText && (
        <p className="text-xs text-muted-foreground">{field.helpText}</p>
      )}
    </div>
  );
}
