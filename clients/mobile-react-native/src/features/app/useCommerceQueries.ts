import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { USER_ROLE, type CareActionType } from '@terravision/shared';
import { appointmentService } from '../../services/appointmentService';
import { arSessionService } from '../../services/arSessionService';
import { cartService } from '../../services/cartService';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { careService } from '../../services/careService';

export function useCommerceQueries(enabled: boolean, role: number | null) {
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: productService.getProducts,
    enabled
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories,
    enabled
  });

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: cartService.getMyCart,
    enabled
  });

  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: orderService.getMyOrders,
    enabled
  });

  const appointmentsQuery = useQuery({
    queryKey: ['appointments', role],
    queryFn: () => appointmentService.getMyAppointments(role ?? 1),
    enabled: enabled && role !== null
  });

  const careCalendarQuery = useQuery({
    queryKey: ['care', 'calendar'],
    queryFn: careService.getMyCalendar,
    enabled: enabled && role === USER_ROLE.Customer
  });

  const arSessionsQuery = useQuery({
    queryKey: ['ar', 'sessions', 'me'],
    queryFn: arSessionService.getMySessions,
    enabled: enabled && role === USER_ROLE.Customer
  });

  const createAppointmentMutation = useMutation({
    mutationFn: appointmentService.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
    }
  });
  const updateAppointmentStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 1 | 2 | 3 | 4 }) => appointmentService.updateStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
    }
  });

  const addItemMutation = useMutation({
    mutationFn: (productId: number) => cartService.addItem(productId, 1),
    onSuccess: (cart) => queryClient.setQueryData(['cart'], cart)
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      cartService.updateItem(productId, quantity),
    onSuccess: (cart) => queryClient.setQueryData(['cart'], cart)
  });

  const removeItemMutation = useMutation({
    mutationFn: (productId: number) => cartService.removeItem(productId),
    onSuccess: (cart) => queryClient.setQueryData(['cart'], cart)
  });

  const clearCartMutation = useMutation({
    mutationFn: cartService.clearCart,
    onSuccess: (cart) => queryClient.setQueryData(['cart'], cart)
  });

  const placeOrderMutation = useMutation({
    mutationFn: orderService.placeFromCart,
    onSuccess: async () => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: ['orders'] }), queryClient.invalidateQueries({ queryKey: ['cart'] })]);
    }
  });

  const completeCareActionMutation = useMutation({
    mutationFn: ({ calendarId, actionType }: { calendarId: number; actionType: CareActionType }) =>
      careService.completeAction(calendarId, actionType),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['care'] });
    }
  });

  return {
    productsQuery,
    categoriesQuery,
    cartQuery,
    ordersQuery,
    appointmentsQuery,
    careCalendarQuery,
    arSessionsQuery,
    createAppointmentMutation,
    updateAppointmentStatusMutation,
    addItemMutation,
    updateItemMutation,
    removeItemMutation,
    clearCartMutation,
    placeOrderMutation,
    completeCareActionMutation
  };
}
