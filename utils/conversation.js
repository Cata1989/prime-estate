export function participantsKeyFor(userAId, userBId) {
  if (!userAId || !userBId) return null;
  return [userAId.toString(), userBId.toString()].sort().join('__');
}
