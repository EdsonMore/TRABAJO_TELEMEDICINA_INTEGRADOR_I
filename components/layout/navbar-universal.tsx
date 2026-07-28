// components/layout/navbar-universal.tsx
"use client";

import { useState, useEffect } from "react";
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
  ChevronDown,
} from "lucide-react";
import { BotonNotificaciones } from "@/components/notificaciones/boton-notificaciones";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href?: string;
  action?: () => void;
  variant?: "default" | "primary" | "success" | "danger";
  showOnMobile?: boolean;
  badge?: string | number;
}

interface NavbarConfig {
  logo: {
    icon: React.ElementType;
    color: string;
  };
  title: string;
  subtitle: string;
  actions: NavItem[];
  quickLinks?: NavItem[];
  contextMenu?: NavItem[];
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
      title: `${usuario?.nombre} ${usuario?.apellido}`,
      subtitle: "Tu salud es nuestra prioridad",
      actions: [
        {
          label: "Nueva Cita",
          icon: Plus,
          action: () => router.push("/dashboard/citas"),
          variant: "primary",
          showOnMobile: true,
        },
        {
          label: "Recetas",
          icon: Pill,
          action: () => {
            window.dispatchEvent(new CustomEvent("openRecetasTab"));
          },
          variant: "default",
          showOnMobile: false,
        },
      ],
      quickLinks: [
        {
          label: "Mis Citas",
          icon: Calendar,
          action: () => router.push("/dashboard/paciente/citas"),
        },
        {
          label: "Mis Recetas",
          icon: Pill,
          action: () => router.push("/dashboard/paciente/recetas"),
        },
        {
          label: "Resultados",
          icon: TestTube,
          action: () => router.push("/dashboard/paciente/resultados"),
        },
      ],
    },

    medico: {
      logo: { icon: Stethoscope, color: "bg-emerald-600" },
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
          label: "Nueva Receta",
          icon: FileText,
          action: () => {
            window.dispatchEvent(new CustomEvent("crearReceta"));
          },
          variant: "primary",
          showOnMobile: true,
        },
      ],
      quickLinks: [
        {
          label: "Mi Agenda",
          icon: Calendar,
          action: () => router.push("/dashboard/medico/agenda"),
        },
        {
          label: "Mis Pacientes",
          icon: Users,
          action: () => router.push("/dashboard/medico/pacientes"),
        },
        {
          label: "Mis Recetas",
          icon: FileText,
          action: () => router.push("/dashboard/medico/recetas"),
        },
      ],
    },

    farmacia: {
      logo: { icon: Pill, color: "bg-purple-600" },
      title: `${usuario?.nombre} ${usuario?.apellido}`,
      subtitle: "Gestión Farmacéutica",
      actions: [
        {
          label: "Recetas",
          icon: Plus,
          action: () => {
            window.dispatchEvent(new CustomEvent("gestionarRecetas"));
          },
          variant: "primary",
          showOnMobile: true,
        },
        {
          label: "Búsqueda",
          icon: Search,
          action: () => {
            window.dispatchEvent(new CustomEvent("buscarRecetas"));
          },
          showOnMobile: false,
        },
      ],
      quickLinks: [
        {
          label: "Recetas Pendientes",
          icon: FileText,
          action: () => router.push("/dashboard/farmacia/recetas"),
        },
        {
          label: "Inventario",
          icon: Package,
          action: () => router.push("/dashboard/farmacia/inventario"),
        },
        {
          label: "Despachos",
          icon: Activity,
          action: () => router.push("/dashboard/farmacia/despacho"),
        },
      ],
    },

    laboratorio: {
      logo: { icon: TestTube, color: "bg-orange-600" },
      title: `${usuario?.nombre} ${usuario?.apellido}`,
      subtitle: "Gestión de Laboratorio",
      actions: [
        {
          label: "Nuevo Resultado",
          icon: FileText,
          action: () => {
            window.dispatchEvent(new CustomEvent("subirResultado"));
          },
          variant: "primary",
          showOnMobile: true,
        },
      ],
      quickLinks: [
        {
          label: "Resultados",
          icon: FileText,
          action: () => router.push("/dashboard/laboratorio/examenes"),
        },
        {
          label: "Solicitudes",
          icon: Calendar,
          action: () => router.push("/dashboard/laboratorio/examenes"),
        },
      ],
    },

    administrador: {
      logo: { icon: Database, color: "bg-red-600" },
      title: "Panel de Administración",
      subtitle: "Control del Sistema MediLink+",
      actions: [
        {
          label: "Nuevo Usuario",
          icon: Plus,
          action: () => {
            window.dispatchEvent(new CustomEvent("registrarUsuario"));
          },
          variant: "primary",
          showOnMobile: true,
        },
        {
          label: "Configuración",
          icon: Settings,
          action: () => router.push("/dashboard/admin/general"),
          showOnMobile: false,
        },
      ],
      quickLinks: [
        {
          label: "Usuarios",
          icon: Users,
          action: () => router.push("/dashboard/admin/usuarios"),
        },
        {
          label: "Sistema",
          icon: Settings,
          action: () => router.push("/dashboard/admin/general"),
        },
        {
          label: "Reportes",
          icon: FileText,
          action: () => router.push("/dashboard/admin/detalles"),
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
  const [showQuickLinks, setShowQuickLinks] = useState(false);

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
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white";
      default:
        return "outline";
    }
  };

  // Determinar el color dinámicamente según el rol
  const getRoleColor = () => {
    switch (usuario?.rol) {
      case "medico":
        return "emerald";
      case "farmacia":
        return "purple";
      case "laboratorio":
        return "orange";
      case "administrador":
        return "red";
      default:
        return "blue";
    }
  };

  const roleColor = getRoleColor();

  return (
    <header className={`bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm`}>
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo y Nombre - Mejorado */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            {usuario.rol === "medico" && usuario?.avatar_url ? (
              <Avatar className={`w-10 h-10 border-2 border-${roleColor}-200 flex-shrink-0`}>
                <AvatarImage
                  src={usuario?.avatar_url}
                  alt={config.title}
                  className="object-cover"
                />
                <AvatarFallback className={`bg-${roleColor}-600 text-white font-semibold text-sm`}>
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div
                className={`w-10 h-10 ${config.logo.color} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm`}
              >
                <LogoIcon className="w-5 h-5 text-white" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-lg font-bold text-gray-900 truncate">
                {config.title}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 hidden xs:block truncate">
                {config.subtitle}
              </p>
            </div>
          </div>

          {/* Acciones Desktop */}
          <div className="hidden sm:flex items-center space-x-2 ml-4">
            {/* Quick Links Dropdown */}
            {config.quickLinks && config.quickLinks.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    <ChevronDown className="w-4 h-4 mr-1" />
                    <span className="hidden md:inline">Accesos Rápidos</span>
                    <span className="md:hidden">+</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {config.quickLinks.map((link, index) => {
                    const Icon = link.icon;
                    return (
                      <DropdownMenuItem
                        key={index}
                        onClick={link.action}
                        className="cursor-pointer"
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {link.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Notificaciones */}
            {showNotifications && <BotonNotificaciones />}

            {/* Botones de Acción Principales */}
            {config.actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  onClick={action.action}
                  size="sm"
                  className={getButtonVariant(action.variant)}
                  variant={action.variant && action.variant !== "default" ? undefined : "outline"}
                  title={action.label}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline ml-1">{action.label}</span>
                  {action.badge && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {action.badge}
                    </Badge>
                  )}
                </Button>
              );
            })}

            {/* Menú de Usuario */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="ml-1">
                  <User className="w-4 h-4 mr-1" />
                  <span className="hidden lg:inline text-xs sm:text-sm">
                    Cuenta
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {usuario?.nombre} {usuario?.apellido}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {usuario?.rol.charAt(0).toUpperCase() +
                        usuario?.rol.slice(1)}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
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
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/dashboard/${usuario.rol}/perfil`)
                  }
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
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
          <div className="sm:hidden border-t border-gray-200 pt-3 pb-3 space-y-2 bg-white">
            {/* Acciones Principales */}
            {config.actions.map((action, index) => {
              const Icon = action.icon;
              if (action.showOnMobile === false) return null;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start text-sm h-10"
                  onClick={() => {
                    action.action?.();
                    setMobileMenuOpen(false);
                  }}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {action.label}
                  {action.badge && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {action.badge}
                    </Badge>
                  )}
                </Button>
              );
            })}

            {/* Quick Links para Móvil */}
            {config.quickLinks && config.quickLinks.length > 0 && (
              <>
                <div className="my-2 px-3 py-1">
                  <p className="text-xs font-semibold text-gray-600">
                    Accesos Rápidos
                  </p>
                </div>
                {config.quickLinks.map((link, index) => {
                  const Icon = link.icon;
                  return (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start text-sm h-10"
                      onClick={() => {
                        link.action?.();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {link.label}
                    </Button>
                  );
                })}
              </>
            )}

            {/* Notificaciones en Móvil */}
            {showNotifications && (
              <div className="w-full">
                <BotonNotificaciones />
              </div>
            )}

            {/* Perfil */}
            <Button
              variant="outline"
              className="w-full justify-start text-sm h-10"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("openProfileModal"));
                setMobileMenuOpen(false);
              }}
            >
              <User className="w-4 h-4 mr-2" />
              Mi Perfil
            </Button>

            {/* Configuración */}
            <Button
              variant="outline"
              className="w-full justify-start text-sm h-10"
              onClick={() => {
                router.push(`/dashboard/${usuario.rol}/perfil`);
                setMobileMenuOpen(false);
              }}
            >
              <Settings className="w-4 h-4 mr-2" />
              Configuración
            </Button>

            {/* Cerrar Sesión */}
            <Button
              variant="outline"
              className="w-full justify-start text-sm h-10 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
