import StatusIndicator from '../StatusIndicator';

export default function StatusIndicatorExample() {
  return (
    <div className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Status Indicators</h3>
      <div className="flex gap-6">
        <StatusIndicator status="online" showLabel />
        <StatusIndicator status="offline" showLabel />
        <StatusIndicator status="warning" showLabel />
        <StatusIndicator status="error" showLabel />
      </div>
      <div className="flex gap-6">
        <StatusIndicator status="online" size="lg" />
        <StatusIndicator status="offline" size="lg" />
        <StatusIndicator status="warning" size="lg" />
        <StatusIndicator status="error" size="lg" />
      </div>
    </div>
  );
}