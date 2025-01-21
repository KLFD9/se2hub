export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatNumber = (num: number | undefined): string => {
  if (!num) return '0';
  return num.toLocaleString('fr-FR');
}; 