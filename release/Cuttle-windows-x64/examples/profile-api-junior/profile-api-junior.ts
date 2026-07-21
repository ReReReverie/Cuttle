export interface Profile {
  id: string;
  displayName: string;
}

export async function loadProfile(
  id: string,
  request: (url: string) => Promise<Response>,
): Promise<Profile | null> {
  const response = await request(`/api/profiles/${id}`);

  // BUG: a 404 error payload is treated as a valid Profile.
  return response.json() as Promise<Profile>;
}

