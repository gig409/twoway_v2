import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    layout("./routes/dashboard/layout.tsx", [
    ...prefix("dashboard", [
          // Companies routes
          index("routes/dashboard/dashboard_home.tsx"),

      layout("./routes/companies/companies_layout.tsx", [
            ...prefix("companies", [
              index("./routes/companies/companies._index.tsx"),
              route("new", "./routes/companies/companies.new.tsx"),
              route(":companyId/edit", "./routes/companies/companies.$companyId.edit.tsx"),
            ]),
          ]),
        ]),
    ]),

] satisfies RouteConfig
