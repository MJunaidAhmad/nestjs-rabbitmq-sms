export class ProviderError extends Error {
  constructor(message: string) {
    super(message);
  }

  toJSON() {
    const ret = { message: JSON.parse(this.message), stack: null };
    if (process.env.NODE_ENV === 'development') {
      ret.stack = this.stack;
    }
    return ret;
  }
}
