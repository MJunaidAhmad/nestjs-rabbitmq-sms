export interface Mapper<T> {
  toDto(dto: T, ...params);
}
