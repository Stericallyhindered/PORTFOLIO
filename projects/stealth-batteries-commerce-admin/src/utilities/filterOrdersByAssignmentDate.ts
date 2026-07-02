/**
 * Filters orders to only include those placed after the dealer was assigned to the sales rep
 * This ensures accurate commission calculations by excluding orders from before the assignment
 */

interface AssignmentHistoryEntry {
  salesRep: number | { id: number }
  assignedAt: string
  unassignedAt?: string | null
  assignedBy?: number | null
  notes?: string
}

interface Order {
  id: string | number
  createdAt: string
  dealer?: {
    id: number
    salesRepAssignmentHistory?: AssignmentHistoryEntry[]
  }
  [key: string]: any
}

/**
 * Filters orders to only include those placed during valid assignment periods
 * @param orders - Array of orders to filter
 * @param salesRepId - ID of the sales rep to filter for
 * @returns Filtered array of orders that were placed during valid assignment periods
 */
export function filterOrdersByAssignmentDate(
  orders: Order[],
  salesRepId: number | string,
): Order[] {
  const targetSalesRepId = typeof salesRepId === 'string' ? parseInt(salesRepId, 10) : salesRepId

  return orders.filter((order) => {
    // If order doesn't have dealer info, skip it
    if (!order.dealer) {
      return false
    }

    const orderDate = new Date(order.createdAt)

    // If there's no assignment history, this is an existing dealer before the system was implemented
    // In this case, we'll allow all orders (backwards compatibility)
    if (
      !order.dealer.salesRepAssignmentHistory ||
      order.dealer.salesRepAssignmentHistory.length === 0
    ) {
      return true
    }

    const assignmentHistory = order.dealer.salesRepAssignmentHistory

    // Find all assignment periods for this sales rep
    const relevantAssignments = assignmentHistory.filter((assignment) => {
      const assignmentSalesRepId =
        typeof assignment.salesRep === 'object' ? assignment.salesRep.id : assignment.salesRep
      return assignmentSalesRepId === targetSalesRepId
    })

    // If no relevant assignments found, this dealer was never assigned to this sales rep
    if (relevantAssignments.length === 0) {
      return false
    }

    // Check if the order was placed during any valid assignment period
    return relevantAssignments.some((assignment) => {
      const assignedAt = new Date(assignment.assignedAt)
      const unassignedAt = assignment.unassignedAt ? new Date(assignment.unassignedAt) : null

      // Order must be after assignment date
      if (orderDate < assignedAt) {
        return false
      }

      // If there's an unassignment date, order must be before it
      if (unassignedAt && orderDate > unassignedAt) {
        return false
      }

      return true
    })
  })
}

/**
 * Gets the assignment date for a specific dealer and sales rep
 * @param dealer - Dealer object with assignment history
 * @param salesRepId - ID of the sales rep
 * @returns The assignment date or null if not found
 */
export function getAssignmentDate(
  dealer: { salesRepAssignmentHistory?: AssignmentHistoryEntry[] },
  salesRepId: number | string,
): Date | null {
  const targetSalesRepId = typeof salesRepId === 'string' ? parseInt(salesRepId, 10) : salesRepId

  if (!dealer.salesRepAssignmentHistory) {
    return null
  }

  // Find the current assignment for this sales rep
  const currentAssignment = dealer.salesRepAssignmentHistory.find((assignment) => {
    const assignmentSalesRepId =
      typeof assignment.salesRep === 'object' ? assignment.salesRep.id : assignment.salesRep
    return assignmentSalesRepId === targetSalesRepId && !assignment.unassignedAt
  })

  return currentAssignment ? new Date(currentAssignment.assignedAt) : null
}

/**
 * Checks if a dealer is currently assigned to a sales rep
 * @param dealer - Dealer object with assignment history
 * @param salesRepId - ID of the sales rep
 * @returns True if currently assigned, false otherwise
 */
export function isCurrentlyAssigned(
  dealer: { salesRepAssignmentHistory?: AssignmentHistoryEntry[] },
  salesRepId: number | string,
): boolean {
  return getAssignmentDate(dealer, salesRepId) !== null
}
