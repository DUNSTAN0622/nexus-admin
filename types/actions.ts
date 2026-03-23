export type MutationState = {
  success: boolean;
  error: string | null;
};

export const INITIAL_MUTATION_STATE: MutationState = {
  success: false,
  error: null,
};
