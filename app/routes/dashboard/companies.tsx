
import type { Route } from "./+types/companies";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Companies Dashboard" },
    { name: "description", content: "Manage your companies here." },
  ];
}

export default function Companies() {
  return (
    <div>
      <h1>Companies</h1>
      {/* Your page content */}
    </div>
  );
}