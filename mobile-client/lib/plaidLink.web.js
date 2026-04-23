const unsupported = () => {
  throw new Error("Plaid Link is not supported on web.");
};

export const create = unsupported;
export const open = unsupported;
