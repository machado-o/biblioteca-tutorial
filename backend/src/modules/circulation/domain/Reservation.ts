export type ReservationStatus = "ativa" | "cancelada" | "atendida";

export type Reservation = {
  id: number; readerId: number; copyId: number; reservedOn: string;
  pickupDeadline: string; expiresOn: string;
  status: ReservationStatus;
};

export function reservationStatus(reservation: Reservation, date: string): ReservationStatus | "expirada" {
  return reservation.status === "ativa" && date >= reservation.expiresOn ? "expirada" : reservation.status;
}
