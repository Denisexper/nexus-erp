import { createResource, Show, For } from "solid-js";
import { locationsApi } from "../../services/locations.api";
import { inventoryApi } from "../../services/inventory.api";
import { useAuth } from "../../context/AuthContext";
import {
  DetailModal,
  DetailSection,
  DetailField,
  DetailAvatar,
} from "../../components/DetailModal";

function LocationDetailModal(props) {
  const auth = useAuth();

  const [detail] = createResource(
    () => props.location?._id,
    (id) => locationsApi.getById(id),
  );

  const location = () => detail()?.data;

  const [stock] = createResource(
    () => (auth.hasPermission("inventory.lots.view") ? props.location?._id : null),
    (id) => inventoryApi.getLocationStock(id),
  );

  return (
    <DetailModal
      onClose={props.onClose}
      loading={detail.loading}
      error={detail.error}
      title={location()?.code}
      subtitle={location()?.warehouse?.name}
      isActive={location()?.isActive}
      avatar={
        location() && (
          <DetailAvatar fallback={location().code?.charAt(0).toUpperCase()} />
        )
      }
    >
      <DetailSection title="Información general" cols={2}>
        <DetailField label="Código" value={location()?.code} />
        <DetailField label="Almacén" value={location()?.warehouse?.name} />
      </DetailSection>

      <Show when={auth.hasPermission("inventory.lots.view")}>
        <DetailSection title="Contenido actual" divider>
          <Show when={stock.loading}>
            <p class="text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
          </Show>
          <Show when={stock() && stock().data.length === 0}>
            <p class="text-sm text-gray-500 dark:text-gray-400">Esta ubicación no tiene existencias.</p>
          </Show>
          <div class="space-y-2">
            <For each={stock()?.data}>
              {(item) => (
                <div class="flex justify-between items-center border border-gray-200 dark:border-gray-800 rounded-md px-3 py-2 text-sm">
                  <div>
                    <p class="text-gray-900 dark:text-white font-medium">{item.product?.name || "-"}</p>
                    <p class="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                      Lote {item.inventoryLot?.lotCode || "-"}
                      <Show when={item.product?.internalCode}> · {item.product.internalCode}</Show>
                    </p>
                  </div>
                  <span class="text-gray-900 dark:text-white font-medium">{item.quantity}</span>
                </div>
              )}
            </For>
          </div>
        </DetailSection>
      </Show>

      <DetailSection title="Coordenadas" cols={3}>
        <DetailField label="Pasillo" value={location()?.aisle} />
        <DetailField label="Estante" value={location()?.rack} />
        <DetailField label="Nivel" value={location()?.level} />
        <DetailField label="Posición" value={location()?.position} />
        <DetailField label="Capacidad" value={location()?.capacity} />
        <DetailField label="Notas" value={location()?.notes} full />
      </DetailSection>

      <DetailSection title="Auditoría" cols={2} divider>
        <DetailField
          label="Creada"
          value={
            location()?.createdAt &&
            new Date(location().createdAt).toLocaleString("es-ES")
          }
        />
        <DetailField
          label="Última actualización"
          value={
            location()?.updatedAt &&
            new Date(location().updatedAt).toLocaleString("es-ES")
          }
        />
      </DetailSection>
    </DetailModal>
  );
}

export default LocationDetailModal;
