const query = <T>(data: T) => ({
  data,
  isLoading: false,
  error: null,
  isFetching: false,
  refetch: jest.fn()
});

const mutation = (mutateAsync: jest.Mock = jest.fn()) => ({
  mutateAsync,
  isPending: false
});

export function createCommerceQueriesMock(
  overrides: Partial<ReturnType<typeof buildCommerceQueriesMock>> = {}
) {
  return { ...buildCommerceQueriesMock(), ...overrides };
}

export function buildCommerceQueriesMock() {
  return {
    productsQuery: query([]),
    storefrontQuery: query(null),
    categoriesQuery: query([]),
    cartQuery: query(null),
    ordersQuery: query([]),
    appointmentsQuery: query([]),
    careCalendarQuery: query({ plants: [] }),
    careCatalogQuery: query([]),
    arSessionsQuery: query([]),
    createAppointmentMutation: mutation(),
    updateAppointmentStatusMutation: mutation(),
    addItemMutation: mutation(),
    updateItemMutation: mutation(),
    removeItemMutation: mutation(),
    clearCartMutation: mutation(),
    placeOrderMutation: mutation(),
    completeCareActionMutation: mutation(),
    addPlantToGardenMutation: mutation()
  };
}
