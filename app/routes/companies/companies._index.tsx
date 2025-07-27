export default function CompaniesIndex() {
  return (
    <div>
      <h2>Companies List</h2>
      {/* Companies table will go here */}
    </div>
  );
}
export function meta() {
  return [
    { title: "All Companies" },
    { name: "description", content: "View and manage all companies." },
  ];
}