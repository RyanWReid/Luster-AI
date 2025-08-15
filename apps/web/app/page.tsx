import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect to projects (main app) by default
  // Auth checking will happen in the layout or middleware
  redirect('/projects')
}