export const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('sr-RS', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};
