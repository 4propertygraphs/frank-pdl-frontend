export async function loadAgencies() {
  const res = await fetch("/agencies.json");
  if (!res.ok) throw new Error("Failed to load agencies.json");
  const json = await res.json();
  return json.find((item: any) => item.type === "table")?.data || [];
}

export async function loadFieldMappings() {
  const res = await fetch("/field_mappings.json");
  if (!res.ok) throw new Error("Failed to load field_mappings.json");
  const json = await res.json();
  return json.find((item: any) => item.type === "table")?.data || [];
}
