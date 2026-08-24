import { A, useNavigate } from '@solidjs/router';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import ThemeToggle from '../ThemeToggle';
import { Show } from 'solid-js';
import erpLogoWhite from '../../assets/erp-logo-white-512.png';

function Sidebar() {
  const auth = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.logout();
    navigate('/login')
  };

  const navLinkClass = (path) =>
    `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors
     hover:bg-white/5 text-white/60 hover:text-white`;

  return (
    <aside class="w-64 h-screen border-r border-black/20
                  bg-night-900 flex flex-col overflow-hidden">

      {/* Logo */}
      <div class="px-6 py-5 border-b border-white/10">
        <div class="flex items-center gap-3">
          <img src={erpLogoWhite} alt="Nexus ERP" class="w-8 h-8 object-contain" />
          <div>
            <p class="font-semibold text-sm text-white">Nexus ERP</p>
            <p class="text-xs text-white/50 capitalize">{auth.user()?.role}</p>
          </div>
        </div>
      </div>

      {/* Navegacion */}
      <nav class="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1">

        {/* Dashboard - Todos los usuarios autenticados */}
        <A href="/dashboard" class={navLinkClass('/dashboard')}>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </A>

        {/* Empresas - raíz de la jerarquía organizacional (Company > Branch > Warehouse > Location) */}
        <Show when={auth.hasPermission('companies.read')}>
          <div class="pt-4 pb-1">
            <p class="px-4 text-xs font-semibold text-white/30 uppercase tracking-wider">
              Organización
            </p>
          </div>

          <A href="/companies" class={navLinkClass('/companies')}>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2M19 21H5m0 0H3m8-14h.01M11 11h.01M11 15h.01M15 7h.01M15 11h.01M15 15h.01" />
            </svg>
            Empresas
          </A>
        </Show>

        <Show when={auth.hasPermission('branches.view')}>
          <A href="/branches" class={navLinkClass('/branches')}>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01" />
            </svg>
            Sucursales
          </A>
        </Show>

        {/* Almacenes - estructura física dentro de una sucursal (ERS 6.5) */}
        <Show when={auth.hasPermission('warehouse_categories.view')}>
          <div class="pt-4 pb-1">
            <p class="px-4 text-xs font-semibold text-white/30 uppercase tracking-wider">
              Almacenes
            </p>
          </div>

          <A href="/warehouse-categories" class={navLinkClass('/warehouse-categories')}>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Categorías de almacén
          </A>
        </Show>

        <Show when={auth.hasPermission('warehouses.view')}>
          <A href="/warehouses" class={navLinkClass('/warehouses')}>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Almacenes
          </A>
        </Show>

        <Show when={auth.hasPermission('locations.view')}>
          <A href="/locations" class={navLinkClass('/locations')}>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Ubicaciones
          </A>
        </Show>

        <Show when={auth.hasPermission('kardex.view')}>
          <A href="/kardex" class={navLinkClass('/kardex')}>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            Kardex
          </A>
        </Show>

        {/* Catálogo - países, categorías, unidades y proveedores para el módulo de productos */}
        <Show when={auth.hasPermission('countries.view')}>
          <div class="pt-4 pb-1">
            <p class="px-4 text-xs font-semibold text-white/30 uppercase tracking-wider">
              Catálogo
            </p>
          </div>

          <A href="/countries" class={navLinkClass('/countries')}>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Países
          </A>

          <A href="/categories" class={navLinkClass('/categories')}>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Categorías
          </A>

          <A href="/sub-categories" class={navLinkClass('/sub-categories')}>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1a4 4 0 100-8 4 4 0 000 8zm6 3a4 4 0 00-3-3.87m-9 0A4 4 0 006 15.13" />
            </svg>
            Sub-categorías
          </A>

          <A href="/units" class={navLinkClass('/units')}>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            Unidades de medida
          </A>

          <A href="/suppliers" class={navLinkClass('/suppliers')}>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Proveedores
          </A>

          <A href="/supplier-contacts" class={navLinkClass('/supplier-contacts')}>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Contactos de proveedor
          </A>

          <A href="/products" class={navLinkClass('/products')}>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Productos
          </A>
        </Show>

        {/* Mostrar según PERMISOS, no por rol */}
        <Show when={auth.hasPermission('users.read') || auth.hasPermission('users.create') || auth.hasPermission('users.update')}>
          <div class="pt-4 pb-1">
            <p class="px-4 text-xs font-semibold text-white/30 uppercase tracking-wider">
              Administración
            </p>
          </div>

          <A href="/users" class={navLinkClass('/users')}>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Usuarios
          </A>
        </Show>

        {/* Roles - Solo si tiene permiso */}
        <Show when={auth.hasPermission('roles.read')}>
          <A href="/roles" class={navLinkClass('/roles')}>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Roles y Permisos
          </A>
        </Show>

        {/* Logs Solo si tiene permiso */}
        <Show when={auth.hasPermission('logs.read')}>
          <A href="/logs" class={navLinkClass('/logs')}>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Bitácoras
          </A>
        </Show>

      </nav>

      {/* Footer: Avatar + Theme */}
      <div class="px-3 py-4 border-t border-white/10 space-y-3">
        
        {/* Theme toggle */}
        <div class="flex items-center justify-between px-4">
          <span class="text-xs text-white/50">Tema</span>
          <ThemeToggle />
        </div>

        {/* Avatar */}
        <div class="flex items-center gap-3 px-4 py-2 rounded-lg 
                    bg-white/5">
          <div class="w-8 h-8 rounded-full bg-white/10 
                      flex items-center justify-center flex-shrink-0">
            <span class="text-sm font-semibold text-white/80">
              {auth.user()?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">
              {auth.user()?.name}
            </p>
            <p class="text-xs text-white/50 truncate">
              {auth.user()?.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            class="text-white/40 hover:text-red-400 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

      </div>
    </aside>
  );
}

export default Sidebar;