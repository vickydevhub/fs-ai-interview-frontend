interface LoadingProps {
    message?: string;
  }
  
  export default function Loading({
    message = "Loading...",
  }: LoadingProps) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    );
  }