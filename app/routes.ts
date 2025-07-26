import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),

    layout("./routes/dashboard/layout.tsx", [
    route("companies", "./routes/dashboard/companies.tsx"),
  ]),

] satisfies RouteConfig
