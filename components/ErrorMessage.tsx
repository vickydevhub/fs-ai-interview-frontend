interface ErrorMessageProps {
    message: string;
  }
  
  export default function ErrorMessage({
    message,
  }: ErrorMessageProps) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
        {message}
      </div>
    );
  }