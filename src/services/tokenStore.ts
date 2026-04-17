let tokenAccessor: (() => string | null) = () => localStorage.getItem('adminToken');

export function setTokenAccessor(accessor: () => string | null): void {
  tokenAccessor = accessor;
}

export function getAuthToken(): string | null {
  return tokenAccessor();
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
