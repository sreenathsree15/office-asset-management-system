function SvgIcon({ children, className = "", viewBox = "0 0 24 24" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox={viewBox}
    >
      {children}
    </svg>
  );
}

export function DashboardIcon(props) {
  return (
    <SvgIcon {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </SvgIcon>
  );
}

export function PackageIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="m12 3 8 4.5-8 4.5L4 7.5 12 3Z" />
      <path d="M4 7.5V16.5L12 21" />
      <path d="M20 7.5V16.5L12 21" />
      <path d="M12 12V21" />
    </SvgIcon>
  );
}

export function ShieldCheckIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M12 3L19 6V12C19 16.5 16.1 20.4 12 21C7.9 20.4 5 16.5 5 12V6L12 3Z" />
      <path d="M9.5 12.2 11.2 13.9 14.8 10.3" />
    </SvgIcon>
  );
}

export function FileTextIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M14 3H7C5.9 3 5 3.9 5 5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V8L14 3Z" />
      <path d="M14 3V8H19" />
      <path d="M9 12H15" />
      <path d="M9 16H15" />
    </SvgIcon>
  );
}

export function LogOutIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M9 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H9" />
      <path d="M16 17 21 12 16 7" />
      <path d="M21 12H9" />
    </SvgIcon>
  );
}

export function ChevronLeftIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="m15 18-6-6 6-6" />
    </SvgIcon>
  );
}

export function CirclePlusIcon(props) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8V16" />
      <path d="M8 12H16" />
    </SvgIcon>
  );
}

export function EditIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M12 20H21" />
      <path d="M16.5 3.5A2.1 2.1 0 0 1 19.5 6.5L8 18L4 19L5 15L16.5 3.5Z" />
    </SvgIcon>
  );
}

export function RotateCcwIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M3 12A9 9 0 1 0 6 5.3" />
      <path d="M3 4V10H9" />
    </SvgIcon>
  );
}

export function ClockIcon(props) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7V12L15.5 14" />
    </SvgIcon>
  );
}

export function AlertTriangleIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M10.3 4.4 3.9 16A2 2 0 0 0 5.7 19H18.3A2 2 0 0 0 20.1 16L13.7 4.4A2 2 0 0 0 10.3 4.4Z" />
      <path d="M12 9V13" />
      <path d="M12 16H12.01" />
    </SvgIcon>
  );
}

export function UserPlusIcon(props) {
  return (
    <SvgIcon {...props}>
      <circle cx="10" cy="8" r="3" />
      <path d="M4.5 19A5.5 5.5 0 0 1 10 14.5A5.5 5.5 0 0 1 15.5 19" />
      <path d="M18 8V14" />
      <path d="M15 11H21" />
    </SvgIcon>
  );
}

export function RefreshCwIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M21 12A9 9 0 0 0 6.8 4.7" />
      <path d="M3 4V10H9" />
      <path d="M3 12A9 9 0 0 0 17.2 19.3" />
      <path d="M21 20V14H15" />
    </SvgIcon>
  );
}

export function TrashIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M4 7H20" />
      <path d="M9 7V5A1.5 1.5 0 0 1 10.5 3.5H13.5A1.5 1.5 0 0 1 15 5V7" />
      <path d="M6 7L7 19A2 2 0 0 0 9 21H15A2 2 0 0 0 17 19L18 7" />
      <path d="M10 11V17" />
      <path d="M14 11V17" />
    </SvgIcon>
  );
}

export function CheckCircleIcon(props) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.2 10.8 14.5 15.8 9.5" />
    </SvgIcon>
  );
}

export function UsersIcon(props) {
  return (
    <SvgIcon {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19A5.5 5.5 0 0 1 9 14.5A5.5 5.5 0 0 1 14.5 19" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M16 14.5A4.6 4.6 0 0 1 20.5 19" />
    </SvgIcon>
  );
}

export function LaptopIcon(props) {
  return (
    <SvgIcon {...props}>
      <rect x="5" y="6" width="14" height="9" rx="1.5" />
      <path d="M3 18H21" />
    </SvgIcon>
  );
}

export function MonitorIcon(props) {
  return (
    <SvgIcon {...props}>
      <rect x="4" y="4" width="16" height="11" rx="1.5" />
      <path d="M12 15V20" />
      <path d="M8 20H16" />
    </SvgIcon>
  );
}

export function PrinterIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M7 8V4H17V8" />
      <rect x="5" y="12" width="14" height="8" rx="1.5" />
      <path d="M5 10A2 2 0 0 1 7 8H17A2 2 0 0 1 19 10V12H5V10Z" />
      <path d="M8 15H16" />
    </SvgIcon>
  );
}

export function BatteryIcon(props) {
  return (
    <SvgIcon {...props}>
      <rect x="4" y="7" width="14" height="10" rx="2" />
      <path d="M18 10H20V14H18" />
      <path d="M8 10L11 14L12.5 12H15" />
    </SvgIcon>
  );
}

export function CopyIcon(props) {
  return (
    <SvgIcon {...props}>
      <rect x="8" y="7" width="11" height="13" rx="1.5" />
      <rect x="5" y="4" width="11" height="13" rx="1.5" />
    </SvgIcon>
  );
}

export function LayoutIcon(props) {
  return (
    <SvgIcon {...props}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M10 5V19" />
      <path d="M4 12H10" />
    </SvgIcon>
  );
}

export function BuildingIcon(props) {
  return (
    <SvgIcon {...props}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 7H9.01" />
      <path d="M15 7H15.01" />
      <path d="M9 11H9.01" />
      <path d="M15 11H15.01" />
      <path d="M9 15H9.01" />
      <path d="M15 15H15.01" />
      <path d="M11 21V17H13V21" />
    </SvgIcon>
  );
}

export function ArmchairIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M7 10V8A3 3 0 0 1 10 5H14A3 3 0 0 1 17 8V10" />
      <path d="M5 12V10A2 2 0 0 0 3 12V15H21V12A2 2 0 0 0 19 10V12" />
      <path d="M5 15V19" />
      <path d="M19 15V19" />
      <path d="M5 15H19" />
    </SvgIcon>
  );
}

export function UserCogIcon(props) {
  return (
    <SvgIcon {...props}>
      <circle cx="10" cy="8" r="3" />
      <path d="M4.5 19A5.5 5.5 0 0 1 10 14.5A5.5 5.5 0 0 1 15.5 19" />
      <circle cx="18" cy="17" r="2.5" />
      <path d="M18 12.5V13.5" />
      <path d="M18 20.5V21.5" />
      <path d="M14.9 15.2L15.8 15.7" />
      <path d="M20.2 18.3L21.1 18.8" />
      <path d="M14.9 18.8L15.8 18.3" />
      <path d="M20.2 15.7L21.1 15.2" />
    </SvgIcon>
  );
}

export function SearchIcon(props) {
  return (
    <SvgIcon {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20L16 16" />
    </SvgIcon>
  );
}

export function XIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M18 6L6 18" />
      <path d="M6 6L18 18" />
    </SvgIcon>
  );
}

export function FileSpreadsheetIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M14 3H7C5.9 3 5 3.9 5 5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V8L14 3Z" />
      <path d="M14 3V8H19" />
      <path d="M8 12H16" />
      <path d="M8 16H16" />
      <path d="M11 10V18" />
    </SvgIcon>
  );
}

export function ArrowLeftIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </SvgIcon>
  );
}

export function ArrowUpDownIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M12 3V21" />
      <path d="m8 7 4-4 4 4" />
      <path d="m16 17-4 4-4-4" />
    </SvgIcon>
  );
}

export function PieChartIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M12 3V12H21" />
      <path d="M12 3A9 9 0 1 0 21 12" />
    </SvgIcon>
  );
}

export function HistoryIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M3 12A9 9 0 1 0 6 5.3" />
      <path d="M3 4V10H9" />
      <path d="M12 7V12L15.5 14" />
    </SvgIcon>
  );
}
