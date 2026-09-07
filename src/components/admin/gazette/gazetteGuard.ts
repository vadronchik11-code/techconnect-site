/**
 * A tiny module singleton so the page sidebar can ask the builder "do you have
 * unsaved work?" and "please save now" without lifting the whole canvas state
 * up. Switching pages used to remount the builder and silently discard every
 * unsaved edit.
 */
let dirty = false;
let save: (() => Promise<void>) | null = null;

export const gazetteGuard = {
  register(isDirty: boolean, saveFn: () => Promise<void>) {
    dirty = isDirty;
    save = saveFn;
  },
  reset() {
    dirty = false;
    save = null;
  },
  isDirty: () => dirty,
  flush: async () => {
    await save?.();
  },
};
