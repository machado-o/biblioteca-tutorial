/**
 * Port: "que dia é hoje" é uma dependência externa como qualquer outra.
 * Enquanto o domínio chamar `new Date()` sozinho, ele é intestável no tempo —
 * e o número de registro depende do ano.
 */
export type Clock = () => Date;
