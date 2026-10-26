// typy danych dla magazynu

export type Kategoria = "kable" | "gniazdka" | "bezpieczniki" | "narzedzia" | "inne";

export interface Produkt {
    id: number;
    ean: string;
    nazwa: string;
    kategoria: Kategoria;
    // miejsce w magazynie np. S1-R2-P3
    miejsce: string;
    ilosc: number;
    cena: number;
}
