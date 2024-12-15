export const appointmentStatusTranslations = {
  SCHEDULED: 'Zakazano',
  CONFIRMED: 'Potvrđeno',
  IN_PROGRESS: 'U toku',
  COMPLETED: 'Završeno',
  CANCELLED: 'Otkazano',
  NO_SHOW: 'Nije se pojavio/la'
};

export const getStatusTranslation = (status: keyof typeof appointmentStatusTranslations) => {
  return appointmentStatusTranslations[status] || status;
};
