export const RULE_MATCH_PROMPT = `Given this room name and type, return the closest Vastu category from this list: kitchen, master_bedroom, bedroom, bathroom, living_room, dining_room, pooja_room, balcony, storage, corridor, study, utility, hall, drawing_room.

Room name: "{{roomName}}"
Current type: "{{roomType}}"

Return ONLY the category name, nothing else.`;
