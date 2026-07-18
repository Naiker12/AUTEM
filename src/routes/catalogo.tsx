import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/catalogo')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/catalogo"!</div>
}
