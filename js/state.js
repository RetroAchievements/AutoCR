export const current = { id: -1, };

export function get_game_title()
{
	if (current.set) return current.set.title;
	return null;
}