const SEARCH_FIELDS = [
  'title',
  'author',
  'date',
  'status',
  'place',
  'note',
  'feature',
  'description',
];

export const filterBySearch = (items, keyword) => {
  if (!Array.isArray(items)) return [];
  const query = keyword.trim().toLowerCase();
  if (!query) return items;

  return items.filter((item) => (
    SEARCH_FIELDS.some((field) => String(item?.[field] || '').toLowerCase().includes(query))
  ));
};
