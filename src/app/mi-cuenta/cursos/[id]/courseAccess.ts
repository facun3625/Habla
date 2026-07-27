export type Profile = { id: number; name: string };
export type ModuleAccess = { profile: Profile };
export type Module = {
  id: number;
  name: string;
  order: number;
  date: string | null;
  accessAll: boolean;
  accessProfiles: ModuleAccess[];
  topics: string[];
};

export function canAccess(mod: Module, profileId: number | null): boolean {
  if (mod.accessAll) return true;
  if (!profileId) return false;
  return mod.accessProfiles.some((a) => a.profile.id === profileId);
}
