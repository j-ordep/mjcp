export function getAssignmentStatusLabel(status: string) {
  switch (status) {
    case "confirmed":
      return "Confirmado";
    case "declined":
      return "Recusado";
    case "swapped":
      return "Trocado";
    default:
      return "Pendente";
  }
}

export function getSwapRequestStatusLabel(status: string) {
  switch (status) {
    case "approved":
      return "Aprovada";
    case "rejected":
      return "Rejeitada";
    case "cancelled":
      return "Cancelada";
    default:
      return "Pendente";
  }
}
