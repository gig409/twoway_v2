import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),

  layout("./routes/dashboard/layout.tsx", [
    route("companies", "./routes/dashboard/companies.tsx"),
    route("companyForm", "./routes/dashboard/companyForm.tsx"),
  ]),

] satisfies RouteConfig
