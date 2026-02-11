interface ErrorMessageProps {
  message: string
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="text-center py-12">
      <p className="text-red-600">{message}</p>
    </div>
  )
}
