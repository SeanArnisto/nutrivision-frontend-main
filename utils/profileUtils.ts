export const formatWeight = (weight?: number) => {
  if (!weight) return 'Not set';
  return `${weight} kg`;
};

export const formatHeight = (height?: number) => {
  if (!height) return 'Not set';
  return `${height} cm`;
};

export const formatAge = (age?: number) => {
  if (!age) return 'Not set';
  return `${age} years old`;
};

export const formatGender = (gender?: string) => {
  if (!gender) return 'Not set';
  return gender.charAt(0).toUpperCase() + gender.slice(1);
};

export const formatName = (name?: string) => {
  if (!name || name === 'No name set') return 'No name set';
  return name;
};