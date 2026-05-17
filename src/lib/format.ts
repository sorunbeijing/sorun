/** ASCII-safe middle dot separator for label/detail pairs */
export const TEXT_SEP = "\u00b7";

export function joinLabelDetail(label: string, detail: string, sep = TEXT_SEP): string {
  return `${label} ${sep} ${detail}`;
}
