// Lowercase + diacritics-stripped form used to populate `cities.name_normalized`
// at seed time and to build the search key on lookup. Both sides MUST stay in
// sync — if the seed normalizes "Žilina" to "zilina", the runtime query for
// "Žilina" has to produce the same string or the ILIKE never matches.
export const normalizeForSearch = (text: string): string =>
    text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
