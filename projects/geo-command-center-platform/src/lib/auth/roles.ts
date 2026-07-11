export type Role =
  | "super_admin"
  | "agency_admin"
  | "strategist"
  | "writer"
  | "analyst"
  | "client_admin"
  | "client_viewer";

export type OrgType = "agency" | "client";

export const AGENCY_ROLES: Role[] = [
  "super_admin",
  "agency_admin",
  "strategist",
  "writer",
  "analyst",
];

export const CLIENT_ROLES: Role[] = ["client_admin", "client_viewer"];

export function isAgencyRole(role: Role): boolean {
  return AGENCY_ROLES.includes(role);
}

export function isClientRole(role: Role): boolean {
  return CLIENT_ROLES.includes(role);
}

export function canManageClients(role: Role): boolean {
  return role === "super_admin" || role === "agency_admin";
}

export function canViewApprovals(role: Role): boolean {
  return (
    role === "super_admin" ||
    role === "agency_admin" ||
    role === "strategist" ||
    role === "client_admin"
  );
}

