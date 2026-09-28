export function loggedInName(): string {
  try {
    if (!localStorage.getItem("token")) return "";
    const user = JSON.parse(localStorage.getItem("user") || "{}") as {
      name?: string;
      last_name?: string;
      fullName?: string;
      full_name?: string;
      atelier_name?: string;
      shop_name?: string;
      atelier?: { name?: string };
    };
    const person = [user.name, user.last_name].filter(Boolean).join(" ").trim()
      || user.fullName
      || user.full_name
      || "";
    const shop = user.atelier_name || user.shop_name || user.atelier?.name || "";
    if (person && shop && person !== shop) return `${person} — ${shop}`;
    return person || shop;
  } catch {
    return "";
  }
}
