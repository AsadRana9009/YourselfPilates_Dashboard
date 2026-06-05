import { ClipLoader } from "react-spinners";

export function TableLoader() {
  return (
    <div className="flex items-center justify-center h-64 w-full">
      <ClipLoader size={48} color="#6366f1" speedMultiplier={0.8} />
    </div>
  );
}
