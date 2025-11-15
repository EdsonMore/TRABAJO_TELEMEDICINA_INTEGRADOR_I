// components/layout/navbar-universal.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Heart,
  Stethoscope,
  Pill,
  TestTube,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  Home,
  Calendar,
  FileText,
  Users,
  Video,
  Plus,
  Search,
  Package,
  Activity,
  Database,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href?: string;
  action?: () => void;
  variant?: "default" | "primary" | "success";
  showOnMobile?: boolean;
}

interface NavbarConfig {
  logo: {
    icon: React.ElementType;
    color: string;
  };
  title: string;
  subtitle: string;
  actions: NavItem[];
}

const getNavbarConfig = (
  rol: string,
  usuario: any,
  router: any,
  pathname: string
): NavbarConfig => {
  const configs: Record<string, NavbarConfig> = {
    paciente: {
      logo: { icon: Heart, color: "bg-blue-600" },
      title: `Hola, ${usuario?.nombre} ${usuario?.apellido}`,
      subtitle: "Panel de salud personal",
      actions: [
        {
          label: "Nueva Cita",
          icon: Plus,
          action: () => router.push("/dashboard/citas"),
          variant: "primary",
          showOnMobile: true,
        },
        {
          label: "Perfil",
          icon: User,
          action: () => {
            // Disparar evento para abrir modal de perfil
            window.dispatchEvent(new CustomEvent("openProfileModal"));
          },
          showOnMobile: false,
        },
      ],
    },

    medico: {
      logo: { icon: Stethoscope, color: "bg-blue-600" },
      title: `Dr. ${usuario?.nombre} ${usuario?.apellido}`,
      subtitle: usuario?.especialidad || "Medicina General",
      actions: [
        {
          label: "Telemedicina",
          icon: Video,
          action: () => {
            window.dispatchEvent(new CustomEvent("iniciarTelemedicina"));
          },
          variant: "success",
          showOnMobile: true,
        },
        {
          label: "Buscar Paciente",
          icon: Search,
          action: () => {
            window.dispatchEvent(new CustomEvent("buscarPacientes"));
          },
          variant: "primary",
          showOnMobile: true,
        },
      ],
    },

    farmacia: {
      logo: { icon: Pill, color: "bg-blue-600" },
      title: `Hola, ${usuario?.nombre} ${usuario?.apellido}`,
      subtitle: "Panel de gestión farmacéutica",
      actions: [
        {
          label: "Nueva Receta",
          icon: Plus,
          action: () => {
            window.dispatchEvent(new CustomEvent("gestionarRecetas"));
          },
          variant: "primary",
          showOnMobile: true,
        },
        {
          label: "Buscar",
          icon: Search,
          showOnMobile: false,
        },
      ],
    },

    laboratorio: {
      logo: { icon: TestTube, color: "bg-blue-600" },
      title: `Hola, ${usuario?.nombre} ${usuario?.apellido}`,
      subtitle: "Panel de gestión de laboratorio",
      actions: [
        {
          label: "Nuevo Resultado",
          icon: FileText,
          variant: "primary",
          showOnMobile: true,
        },
      ],
    },

    administrador: {
      logo: { icon: Settings, color: "bg-blue-600" },
      title: "Panel de Administración",
      subtitle: "Control total del sistema MediLink+",
      actions: [
        {
          label: "Registrar Usuario",
          icon: Plus,
          action: () => {
            window.dispatchEvent(new CustomEvent("registrarUsuario"));
          },
          variant: "primary",
          showOnMobile: true,
        },
      ],
    },
  };

  return configs[rol] || configs.paciente;
};

interface NavbarUniversalProps {
  showNotifications?: boolean;
  notificationCount?: number;
}

export function NavbarUniversal({
  showNotifications = true,
  notificationCount = 0,
}: NavbarUniversalProps) {
  const { usuario, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!usuario) return null;

  const config = getNavbarConfig(
    usuario?.rol ?? "paciente", 
    usuario,
    router,
    pathname ?? "" 
  );

  const LogoIcon = config.logo.icon;

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const getInitials = () => {
    const nombre = usuario?.nombre?.trim().split(" ") || [];
    const apellido = usuario?.apellido?.trim().split(" ") || [];
    const inicialNombre = nombre[0]?.[0]?.toUpperCase() || "";
    const inicialApellido =
      apellido[apellido.length - 1]?.[0]?.toUpperCase() || "";
    return inicialNombre + inicialApellido || "ML";
  };

  const getButtonVariant = (variant?: string) => {
    switch (variant) {
      case "primary":
        return "bg-blue-600 hover:bg-blue-700 text-white";
      case "success":
        return "bg-green-600 hover:bg-green-700 text-white";
      default:
        return "outline";
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y Nombre */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {usuario.rol === "medico" ? (
              <Avatar className="w-10 h-10 border-2 border-blue-200 flex-shrink-0">
                <AvatarImage
                  src={usuario?.avatar_url ?? ""}
                  alt={config.title}
                  className="object-cover"
                />
                <AvatarFallback className="bg-blue-600 text-white font-semibold text-sm">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div
                className={`w-10 h-10 ${config.logo.color} rounded-full flex items-center justify-center flex-shrink-0`}
              >
                <LogoIcon className="w-5 h-5 text-white" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-gray-900 truncate">
                {config.title}
              </h1>
              <p className="text-sm text-gray-600 hidden xs:block truncate">
                {config.subtitle}
              </p>
            </div>
          </div>

          {/* Acciones Desktop */}
          <div className="hidden sm:flex items-center space-x-2 ml-4">
            {/* Notificaciones */}
            {showNotifications && (
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                {notificationCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {notificationCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* Botones de Acción Principales */}
            {config.actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  onClick={action.action}
                  size="sm"
                  className={getButtonVariant(action.variant)}
                  variant={action.variant ? undefined : "outline"}
                >
                  <Icon className="w-4 h-4 mr-1" />
                  <span className="hidden md:inline">{action.label}</span>
                  <span className="md:hidden">
                    {action.label.split(" ")[0]}
                  </span>
                </Button>
              );
            })}

            {/* Menú de Usuario */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="ml-2">
                  <User className="w-4 h-4 mr-1" />
                  <span className="hidden lg:inline">Mi Cuenta</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {usuario?.nombre} {usuario?.apellido}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {usuario?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push(`/dashboard/${usuario.rol}`)}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Inicio
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("openProfileModal"));
                  }}
                >
                  <User className="w-4 h-4 mr-2" />
                  Mi Perfil
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Botón Menú Móvil */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden ml-2"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Menú Móvil */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-200 pt-4 pb-4 space-y-2 bg-white">
            {/* Acciones Principales */}
            {config.actions
              .filter((action) => action.showOnMobile !== false)
              .map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-base h-12"
                    onClick={() => {
                      action.action?.();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {action.label}
                  </Button>
                );
              })}

            {/* Perfil */}
            <Button
              variant="outline"
              className="w-full justify-start text-base h-12"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("openProfileModal"));
                setMobileMenuOpen(false);
              }}
            >
              <User className="w-5 h-5 mr-3" />
              Mi Perfil
            </Button>

            {/* Configuración */}
            <Button
              variant="outline"
              className="w-full justify-start text-base h-12"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Settings className="w-5 h-5 mr-3" />
              Configuración
            </Button>

            {/* Cerrar Sesión */}
            <Button
              variant="outline"
              className="w-full justify-start text-base h-12 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Cerrar Sesión
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

// ============================================
// EJEMPLO DE USO EN LOS DASHBOARDS
// ============================================

/*
// app/dashboard/paciente/page.tsx
import { NavbarUniversal } from "@/components/layout/navbar-universal";

export default function DashboardPacientePage() {
  const [editarPerfilOpen, setEditarPerfilOpen] = useState(false);

  useEffect(() => {
    // Escuchar evento de apertura de modal
    const handleOpenProfile = () => setEditarPerfilOpen(true);
    window.addEventListener("openProfileModal", handleOpenProfile);
    
    return () => window.removeEventListener("openProfileModal", handleOpenProfile);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarUniversal showNotifications notificationCount={3} />
      
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Contenido del dashboard *\/}
      </main>

      {/* Modales *\/}
      <EditarPerfilModal
        isOpen={editarPerfilOpen}
        onClose={() => setEditarPerfilOpen(false)}
        perfil={perfil}
        onPerfilActualizado={recargarDatos}
      />
    </div>
  );
}

// ============================================
// app/dashboard/medico/page.tsx
import { NavbarUniversal } from "@/components/layout/navbar-universal";

export default function DashboardMedicoPage() {
  const [buscarPacientesOpen, setBuscarPacientesOpen] = useState(false);

  useEffect(() => {
    const handleBuscarPacientes = () => setBuscarPacientesOpen(true);
    const handleTelemedicina = () => iniciarTelemedicina();
    
    window.addEventListener("buscarPacientes", handleBuscarPacientes);
    window.addEventListener("iniciarTelemedicina", handleTelemedicina);
    
    return () => {
      window.removeEventListener("buscarPacientes", handleBuscarPacientes);
      window.removeEventListener("iniciarTelemedicina", handleTelemedicina);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarUniversal showNotifications notificationCount={5} />
      
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Contenido del dashboard *\/}
      </main>
    </div>
  );
}

// ============================================
// app/dashboard/farmacia/page.tsx
import { NavbarUniversal } from "@/components/layout/navbar-universal";

export default function DashboardFarmacia() {
  useEffect(() => {
    const handleGestionRecetas = () => setModuloActivo("recetas");
    window.addEventListener("gestionarRecetas", handleGestionRecetas);
    
    return () => window.removeEventListener("gestionarRecetas", handleGestionRecetas);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarUniversal />
      
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Contenido del dashboard *\/}
      </main>
    </div>
  );
}
*/
