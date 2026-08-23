export interface UserRow {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  isActive: boolean;
  role: string;
  domainName?: string | null;
}

export interface DomainGroup {
  domainName: string;
  domainManager: UserRow | null;
  areaManagers: UserRow[];
}
