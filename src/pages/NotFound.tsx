import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center text-slate-200">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-brand-400">
          404
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Page not found</h1>
        <p className="mt-2 max-w-md text-slate-400">
          The page you are looking for doesn&apos;t exist or has been moved.
          Try returning to the dashboard.
        </p>
      </div>
      <Link
        to="/"
        className="rounded-lg bg-brand-500 px-6 py-3 font-medium text-white shadow-card transition hover:bg-brand-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300"
      >
        Back to dashboard
      </Link>
    </div>
  )
}

export default NotFoundPage
