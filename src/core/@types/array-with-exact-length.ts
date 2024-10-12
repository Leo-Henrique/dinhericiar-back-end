export type ArrayWithExactLength<
  Length extends number,
  ItemType = unknown,
  Arr extends unknown[] = [],
> = Arr["length"] extends Length
  ? Arr
  : ArrayWithExactLength<Length, ItemType, [...Arr, ItemType]>;
