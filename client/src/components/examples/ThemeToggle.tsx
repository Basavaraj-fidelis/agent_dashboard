import ThemeToggle from '../ThemeToggle';

export default function ThemeToggleExample() {
  return (
    <div className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Theme Toggle</h3>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <span className="text-sm text-muted-foreground">
          Click to toggle between light and dark modes
        </span>
      </div>
    </div>
  );
}