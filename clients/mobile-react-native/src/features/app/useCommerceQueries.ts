import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartService } from '../../services/cartService';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';

export function useCommerceQueries(enabled: boolean) {
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: productService.getProducts,
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

  return {
    productsQuery,
    cartQuery,
    ordersQuery,
    addItemMutation,
    updateItemMutation,
    removeItemMutation,
    clearCartMutation,
    placeOrderMutation
  };
}
