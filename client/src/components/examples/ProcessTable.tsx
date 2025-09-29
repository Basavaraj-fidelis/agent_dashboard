import ProcessTable from '../ProcessTable';

export default function ProcessTableExample() {
  //todo: remove mock functionality
  const mockCpuProcesses = [
    {
      pid: 48408,
      name: "WmiPrvSE.exe",
      cpu_percent: 25.2,
      memory_percent: 0.505,
      memory_mb: 37.98
    },
    {
      pid: 5264,
      name: "am_aiops_agent_restart.exe",
      cpu_percent: 15.6,
      memory_percent: 0.076,
      memory_mb: 5.69
    },
    {
      pid: 1896,
      name: "dwm.exe",
      cpu_percent: 8.5,
      memory_percent: 1.508,
      memory_mb: 113.40
    }
  ];

  const mockMemoryProcesses = [
    {
      pid: 21908,
      name: "brave.exe",
      cpu_percent: 0.0,
      memory_percent: 4.095,
      memory_mb: 308.05
    },
    {
      pid: 3488,
      name: "MemCompression",
      cpu_percent: 0.0,
      memory_percent: 3.245,
      memory_mb: 244.12
    },
    {
      pid: 10268,
      name: "explorer.exe",
      cpu_percent: 0.0,
      memory_percent: 2.546,
      memory_mb: 191.48
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <h3 className="text-lg font-semibold">Process Tables</h3>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ProcessTable
          processes={mockCpuProcesses}
          title="Top CPU Processes"
          type="cpu"
          systemUsage={{
            cpu: 15.4,
            memory: 65.2
          }}
        />
        <ProcessTable
          processes={mockMemoryProcesses}
          title="Top Memory Processes"
          type="memory"
          systemUsage={{
            memory: 65.2,
            totalRam: "7.35 GB"
          }}
        />
      </div>
    </div>
  );
}