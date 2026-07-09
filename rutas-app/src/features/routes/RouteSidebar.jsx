import { ArrowLeft } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';

export default function RouteSidebar({ rutas, rutaActivaId, onSeleccionar, loading }) {
  const { state } = useSidebar();
  const colapsada = state === 'collapsed';

  return (
    <Sidebar>
      <SidebarHeader>
        <a
          href="/"
          className="flex min-w-0 items-center gap-2 px-1 py-1 rounded-md text-ink hover:bg-surface-card transition-colors"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-card">
            <ArrowLeft className="size-4" />
          </span>
          {!colapsada && (
            <span className="truncate text-body-strong font-semibold">
              Regresar
            </span>
          )}
        </a>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Rutas disponibles</SidebarGroupLabel>
          <SidebarMenu>
            {loading
              ? Array.from({ length: rutas.length || 6 }).map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                ))
              : rutas.map((ruta) => {
                  const activa = ruta.id === rutaActivaId;
                  const titulo = ruta.nombre.replace(/^R\d+\.\s*/, '');
                  return (
                    <SidebarMenuItem key={ruta.id}>
                      <SidebarMenuButton
                        isActive={activa}
                        tooltip={`${ruta.id} · ${titulo}`}
                        onClick={() => onSeleccionar(ruta.id)}
                        aria-current={activa ? 'page' : undefined}
                        data-testid={`sidebar-route-${ruta.id}`}
                        className={
                          activa
                            ? ''
                            : 'opacity-50 blur-[1.3px] transition-all duration-200 hover:opacity-100 hover:blur-0'
                        }
                      >
                        <span className="flex h-5 min-w-[1.75rem] shrink-0 items-center justify-center text-body-strong font-bold tabular-nums">
                          {ruta.id}
                        </span>
                        <span className="truncate text-caption-md text-mute group-data-[active=true]:text-primary group-data-[collapsible=icon]:hidden">
                          {titulo}
                        </span>
                        <span className="ml-auto shrink-0 text-caption-md tabular-nums text-ash group-data-[collapsible=icon]:hidden">
                          {ruta.paradas.length}
                        </span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {!colapsada && (
          <p className="px-2 text-caption-md text-mute">
            © {new Date().getFullYear()} VIÑOPLASTIC
          </p>
        )}
      </SidebarFooter>


    </Sidebar>
  );
}
