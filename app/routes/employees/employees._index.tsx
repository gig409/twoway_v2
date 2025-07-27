import { useLoaderData } from "react-router"
//import  { type Employee } from "../../../generated/prisma"


// Define the Employee type manually to avoid import issues
interface Employee {
  employee_id: string
  employee_name: string | null
  employee_mobile: string
  employee_email: string
  employee_position: string
  position: string
  company_id: string
  createdAt: Date
  updatedAt: Date
}

export async function loader() {
  try {
    const { getDb } = await import('../../lib/db.server');
    const db = await getDb();

    const employees = await db.employee.findMany()
  
    return { employees }
  } catch (error) {
    console.error('Database error:', error)
    return { employees: [] }
  }
}

export default function EmployeesIndex() {
  const { employees } = useLoaderData<typeof loader>()
  return (
    <div>
      <h2>Employees</h2>
      {/* Employee list will go here */}
      {/* 
        You now have access to the Employee type with these properties:
        - employee_id: string
        - employee_name: string | null
        - employee_mobile: string
        - employee_email: string
        - employee_position: string
        - position: string
        - company_id: string
        - createdAt: Date
        - updatedAt: Date
        
        Example usage:
        const employee: Employee = {
          employee_id: "123",
          employee_name: "John Doe",
          employee_mobile: "+1234567890",
          employee_email: "john@company.com",
          employee_position: "Developer",
          position: "Senior",
          company_id: "company-123",
          createdAt: new Date(),
          updatedAt: new Date()
        };
      */}
      <ul>
        {employees.map((employee: Employee) => (
          <li key={employee.employee_id}>
            {employee.employee_name} - {employee.employee_email}
          </li>
        ))}
      </ul>
    </div>
  );
}