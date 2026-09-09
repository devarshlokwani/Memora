/** The key that triggers a button, shown on the button itself. */
export function Shortcut({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="ml-2 hidden rounded border border-current/25 px-1.5 py-0.5 align-middle font-sans text-[0.7rem] opacity-70 sm:inline">
      {children}
    </kbd>
  );
}
